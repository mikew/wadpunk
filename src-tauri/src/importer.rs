use std::{
  fs::{create_dir_all, File},
  path::Path,
};

use compress_tools::{uncompress_archive, Ownership};
use fs_extra::{copy_items, dir::CopyOptions};

use crate::database;

pub fn import_file(file: &str) {
  let lowercase = file.to_lowercase();

  if lowercase.ends_with(".zip")
    || lowercase.ends_with(".7z")
    || lowercase.ends_with(".rar")
    || lowercase.ends_with(".gz")
    || lowercase.ends_with(".bz2")
    || lowercase.ends_with(".xz")
    || lowercase.ends_with(".zst")
  {
    extract_archive_to_games_directory(file);
  } else {
    let file_path = Path::new(file);
    let games_directory = database::get_games_directory();

    let destination = games_directory.join(file_path.file_name().unwrap());

    let mut copy_options = CopyOptions::new();
    copy_options.overwrite = true;

    copy_items(&[file], database::get_games_directory(), &copy_options).unwrap();
  }
}

pub fn extract_archive_to_games_directory(file: &str) {
  let source = File::open(file).unwrap();
  let games_directory = database::get_games_directory();

  // Get basename of source without extension.
  // Would prefer to use `.file_prefix`, but of course that's "experimental" in
  // Rust, so we have to use the potentially uglier `.file_stem` instead.
  let basename = Path::new(file).file_stem().unwrap().to_str().unwrap();

  let destination = games_directory.join(basename);

  create_dir_all(&destination).unwrap();

  uncompress_archive(source, &destination, Ownership::Ignore).unwrap();
}
