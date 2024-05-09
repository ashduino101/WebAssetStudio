use std::io::Cursor;
use bitstream_io::{BitRead, BitReader, Endianness, LittleEndian};


pub fn ilog(val: u32) -> u32 {
    let mut v = val;
    let mut ret = 0u32;
    while v > 0 {
        ret += 1;
        v >>= 1;
    }
    ret
}

pub fn icount(val: u32) -> u32 {
    let mut v = val;
    let mut ret = 0u32;
    while v > 0 {
        ret += v & 1;
        v >>= 1;
    }
    ret
}

#[derive(Debug)]
struct Floor0 {

}

fn read_floor0<T: std::io::Read, E: Endianness>(stream: &mut BitReader<T, E>) -> Result<Floor0, std::io::Error> {
    Ok(Floor0 {})
}

#[derive(Debug)]
struct Floor1 {
    partition_class_list: Vec<u8>,
    class_dimensions: Vec<u8>,
    class_subclasses: Vec<u8>,
    class_masterbooks: Vec<u8>,
    subclass_books: Vec<Vec<i16>>,
    x_list: Vec<u16>,
}

fn read_floor1<T: std::io::Read, E: Endianness>(stream: &mut BitReader<T, E>) -> Result<Floor1, std::io::Error> {
    let partitions = stream.read::<u8>(5)?;
    let mut partition_class_list = Vec::new();
    for _ in 0..partitions {
        partition_class_list.push(stream.read::<u8>(4)?);
    }
    let max_class = *partition_class_list.iter().max().expect("must have at least 1 class");
    let mut class_dimensions = Vec::new();
    let mut class_subclasses = Vec::new();
    let mut class_masterbooks = Vec::new();
    let mut subclass_books = Vec::new();
    for _ in 0..(max_class + 1) {
        class_dimensions.push(stream.read::<u8>(3)? + 1);
        let subclass = stream.read::<u8>(2)?;
        class_subclasses.push(subclass);
        if subclass != 0 {
            class_masterbooks.push(stream.read::<u8>(8)?);
        } else {
            class_masterbooks.push(0);
        }
        let mut subclass_book = Vec::new();
        for _ in 0..(1 << subclass) {
            subclass_book.push(stream.read::<i16>(8)? - 1);
        }
        subclass_books.push(subclass_book);
    }

    let multiplier = stream.read::<u8>(2)? + 1;
    let rangebits = stream.read::<u8>(4)?;
    let mut x_list = Vec::new();
    x_list.push(0u16);
    x_list.push(1u16 << (rangebits as u16));
    let mut count = 0;
    let mut k = 0;
    for i in 0..partitions {
        let current_class = partition_class_list[i as usize];
        let dim = class_dimensions[current_class as usize];
        count += dim;
        while k < count {
            x_list.push(stream.read::<u16>(rangebits as u32)?);
            k += 1;
        }
    }

    Ok(Floor1 {
        partition_class_list,
        class_dimensions,
        class_subclasses,
        class_masterbooks,
        subclass_books,
        x_list
    })
}

#[derive(Debug)]
enum FloorType {
    Floor0(Floor0),
    Floor1(Floor1)
}

#[derive(Debug)]
struct ResidueSetup {
    begin: u32,
    end: u32,
    partition_size: u32,
    classifications: u32,
    classbook: u32,
    second_stages: Vec<u8>,
    books: Vec<u8>,
}

fn read_residue<T: std::io::Read, E: Endianness>(stream: &mut BitReader<T, E>) -> Result<ResidueSetup, std::io::Error> {
    let begin = stream.read::<u32>(24)?;
    let end = stream.read::<u32>(24)?;
    let partition_size = stream.read::<u32>(24)? + 1;
    let classifications = stream.read::<u32>(6)? + 1;
    let classbook = stream.read::<u32>(8)?;

    let mut second_stages = Vec::new();
    let mut acc = 0;
    for _ in 0..classifications {
        let mut cascade = stream.read::<u8>(3)?;
        let cflag = stream.read::<u8>(1)? != 0;
        if cflag {
            let c = stream.read::<u8>(5)?;
            cascade |= c << 3;
        }
        second_stages.push(cascade);
        acc += icount(cascade as u32);
    }

    let mut books = Vec::new();
    for _ in 0..acc {
        books.push(stream.read::<u8>(8)?);
    }

    Ok(ResidueSetup {
        begin,
        end,
        partition_size,
        classifications,
        classbook,
        second_stages,
        books
    })
}

#[derive(Debug)]
enum ResidueType {
    Residue0(ResidueSetup),
    Residue1(ResidueSetup),
    Residue2(ResidueSetup),
}

#[derive(Debug)]
struct Mapping {
    coupling_mag: Vec<u8>,
    coupling_ang: Vec<u8>,
    chmuxlist: Vec<u8>,
    time_submaps: Vec<u8>,
    floor_submaps: Vec<u8>,
    residue_submaps: Vec<u8>,
}

fn read_mapping<T: std::io::Read, E: Endianness>(stream: &mut BitReader<T, E>, channels: u8) -> Result<Mapping, std::io::Error> {
    let b = stream.read::<u8>(1)? != 0;
    let mut submaps = 1;
    if b {
        submaps = stream.read::<u8>(4)? + 1;
    }

    let mut coupling_mag = Vec::new();
    let mut coupling_ang = Vec::new();

    let b = stream.read::<u8>(1)? != 0;
    if b {
        let coupling_steps = stream.read::<u8>(8)? + 1;
        for _ in 0..coupling_steps {
            let test_m = stream.read::<u8>(ilog((channels as u32) - 1))?;
            let test_a = stream.read::<u8>(ilog((channels as u32) - 1))?;
            coupling_mag.push(test_m);
            coupling_ang.push(test_a);
        }
    }

    if stream.read::<u8>(2)? != 0 {
        panic!("reserved, should be 0");
    }

    let mut chmuxlist = Vec::new();

    if submaps > 1 {
        for _ in 0..channels {
            let chmux = stream.read::<u8>(4)?;
            chmuxlist.push(chmux);
        }
    }

    let mut time_submaps = Vec::new();
    let mut floor_submaps = Vec::new();
    let mut residue_submaps = Vec::new();

    for _ in 0..submaps {
        let time_submap = stream.read::<u8>(8)?;
        let floor_submap = stream.read::<u8>(8)?;
        let residue_submap = stream.read::<u8>(8)?;
        time_submaps.push(time_submap);
        floor_submaps.push(floor_submap);
        residue_submaps.push(residue_submap);
    }

    Ok(Mapping {
        coupling_mag,
        coupling_ang,
        chmuxlist,
        time_submaps,
        floor_submaps,
        residue_submaps
    })
}

#[derive(Debug)]
enum MappingType {
    Mapping0(Mapping)
}

#[derive(Debug)]
struct Mode {
    block_flag: bool,
    window_type: u16,
    transform_type: u16,
    mapping: u8
}

fn read_mode<T: std::io::Read, E: Endianness>(stream: &mut BitReader<T, E>) -> Result<Mode, std::io::Error> {
    let block_flag = stream.read::<u8>(1)? != 0;
    let window_type = stream.read::<u16>(16)?;
    let transform_type = stream.read::<u16>(16)?;
    let mapping = stream.read::<u8>(8)?;
    Ok(Mode {
        block_flag,
        window_type,
        transform_type,
        mapping
    })
}


#[derive(Debug)]
struct SetupHeader {
    books: Vec<Book>,
    times: Vec<u16>,
    floors: Vec<FloorType>,
    residues: Vec<ResidueType>,
    mappings: Vec<MappingType>,
    modes: Vec<Mode>,
}

#[derive(Debug)]
struct Book {
    dim: u16,
    num_entries: u32,
    is_ordered: bool,
    lengthlist: Vec<u8>,
    quantlist: Vec<u32>
}

fn parse_setup_header(header: &[u8], channels: u8) -> Result<SetupHeader, std::io::Error> {
    let mut bitstream = BitReader::endian(Cursor::new(header), LittleEndian);
    let packet_type = bitstream.read::<u8>(8)?;
    let sig = bitstream.read::<u64>(48);  // vorbis

    let num_books = bitstream.read::<u8>(8)? + 1;
    let mut books = Vec::new();
    for _ in 0..num_books {
        if bitstream.read::<u32>(24)? != 0x564342 {
            panic!("invalid book signature");
        }
        let dim = bitstream.read::<u16>(16)?;
        let num_entries = bitstream.read::<u32>(24)?;
        let is_ordered = bitstream.read::<u8>(1)? != 0;

        let mut lengthlist = Vec::new();
        if is_ordered {
            let length = bitstream.read::<u8>(5)? + 1;
            let mut i = 0;
            while i < num_entries {
                let num = bitstream.read::<u8>(ilog(num_entries) as u32)?;
                for _ in 0..num {
                    lengthlist.push(length);
                    i += 1;
                }
            }
        } else {
            let has_unused = bitstream.read::<u8>(1)? != 0;

            if has_unused {  // has unused entries
                for _ in 0..num_entries {
                    if bitstream.read::<u8>(1)? != 0 {
                        let num = bitstream.read::<u8>(5)?;
                        lengthlist.push(num + 1);
                    } else {
                        lengthlist.push(0);
                    }
                }
            } else {
                for _ in 0..num_entries {
                    lengthlist.push(bitstream.read::<u8>(5)? + 1);
                }
            }
        }

        let maptype = bitstream.read::<u8>(4)?;
        let mut quantlist = Vec::new();
        match maptype {
            0 => {},  // none
            1 | 2 => {
                let q_min = bitstream.read::<u32>(32)?;
                let q_delta = bitstream.read::<u32>(32)?;
                let q_quant = bitstream.read::<u8>(4)? + 1;
                let q_sequencep = bitstream.read::<u8>(1)?;

                let mut quantvals = 0;
                match maptype {
                    1 => {
                        let mut vals = (num_entries as f32).powf(1.0 / (dim as f32)).floor() as i64;
                        if vals < 1 {
                            vals = 1;
                        }
                        loop {
                            let mut acc = 1i64;
                            let mut acc1 = 1i64;
                            let mut i = 0i64;
                            for _ in 0..dim {
                                if (((num_entries as i64) / vals) as i64) < acc {
                                    break;
                                }
                                acc *= vals as i64;
                                if (i64::MAX / (vals + 1)) < acc1 {
                                    acc1 = i64::MAX;
                                } else {
                                    acc1 *= vals + 1;
                                }
                                i += 1;
                            }
                            if i >= (dim as i64) && acc <= (num_entries as i64) && acc1 > (num_entries as i64) {
                                break;
                            } else {
                                if i < (dim as i64) || acc > (num_entries as i64) {
                                    vals -= 1;
                                } else {
                                    vals += 1;
                                }
                            }
                        }

                        quantvals = vals;
                    },
                    2 => {
                        quantvals = (num_entries as i64) * (dim as i64);
                    },
                    _ => unreachable!()
                }

                for _ in 0..quantvals {
                    quantlist.push(bitstream.read::<u32>(q_quant as u32)?);
                }
            },
            _ => unreachable!()
        }

        let book = Book {
            dim,
            num_entries,
            is_ordered,
            lengthlist,
            quantlist
        };
        books.push(book);
    }

    // time settings
    let num_times = bitstream.read::<u8>(6)? + 1;
    let mut times = Vec::new();
    for _ in 0..num_times {
        let test = bitstream.read::<u16>(16)?;
        times.push(test);
    }

    // floors
    let num_floors = bitstream.read::<u8>(6)? + 1;
    let mut floors = Vec::new();
    for _ in 0..num_floors {
        let floor_type = bitstream.read::<u16>(16)?;
        floors.push(match floor_type {
            0 => todo!(),
            1 => FloorType::Floor1(read_floor1(&mut bitstream)?),
            _ => panic!("invalid floor type {}", floor_type)
        });
    }

    // residues
    let num_residues = bitstream.read::<u8>(6)? + 1;
    let mut residues = Vec::new();
    for _ in 0..num_residues {
        let residue_type = bitstream.read::<u16>(16)?;
        residues.push(match residue_type {
            0 => ResidueType::Residue0(read_residue(&mut bitstream)?),
            1 => ResidueType::Residue1(read_residue(&mut bitstream)?),
            2 => ResidueType::Residue2(read_residue(&mut bitstream)?),
            _ => panic!("invalid residue type {}", residue_type)
        });
    }

    // mappings
    let num_mappings = bitstream.read::<u8>(6)? + 1;
    let mut mappings = Vec::new();
    for _ in 0..num_mappings {
        let mapping_type = bitstream.read::<u16>(16)?;
        mappings.push(match mapping_type {
            0 => MappingType::Mapping0(read_mapping(&mut bitstream, channels)?),
            _ => panic!("invalid mapping type {}", mapping_type)
        })
    }

    // modes
    let num_modes = bitstream.read::<u8>(6)? + 1;
    let mut modes = Vec::new();
    for _ in 0..num_modes {
        modes.push(read_mode(&mut bitstream)?);
    }

    Ok(SetupHeader {
        books,
        times,
        floors,
        residues,
        mappings,
        modes
    })
}
