use std::{fs::create_dir_all, path::Path, process::Command};

use fs_extra::{copy_items, dir::CopyOptions};

use crate::database;
use crate::error::describe_exit_status;
use crate::error::Error;
use crate::error::Result;

pub fn import_file(file: &str, seven_zip_path: &str) -> Result<String> {
  let lowercase = file.to_lowercase();

  if lowercase.ends_with(".zip")
    || lowercase.ends_with(".7z")
    || lowercase.ends_with(".rar")
    || lowercase.ends_with(".gz")
    || lowercase.ends_with(".bz2")
    || lowercase.ends_with(".xz")
    || lowercase.ends_with(".zst")
  {
    extract_archive_to_games_directory(file, seven_zip_path)?;

    Ok(format!("{}/", file_stem(file)?))
  } else {
    let mut copy_options = CopyOptions::new();
    copy_options.overwrite = true;

    copy_items(&[file], database::get_games_directory()?, &copy_options).map_err(|source| {
      Error::Copy {
        file: file.to_string(),
        source,
      }
    })?;

    let file_name = Path::new(file)
      .file_name()
      .and_then(|name| name.to_str())
      .ok_or_else(|| Error::InvalidFileName(file.to_string()))?;

    Ok(file_name.to_string())
  }
}

pub fn extract_archive_to_games_directory(file: &str, seven_zip_path: &str) -> Result<()> {
  let destination = database::get_games_directory()?.join(file_stem(file)?);

  create_dir_all(&destination).map_err(Error::io("create folder", &destination))?;

  let status = Command::new(seven_zip_path)
    .args([
      "x",
      "-aoa",
      &format!("-o{}", database::path_to_str(&destination)?),
      file,
    ])
    .status()
    .map_err(Error::io("run", Path::new(seven_zip_path)))?;

  // 7-Zip exits with 1 for warnings (e.g. a file it couldn't read), anything
  // higher is a failure.
  if !matches!(status.code(), Some(0 | 1)) {
    return Err(Error::ExtractFailed {
      file: file.to_string(),
      outcome: describe_exit_status(status),
    });
  }

  Ok(())
}

/// The name without its extension.
/// Would prefer to use `.file_prefix`, but of course that's "experimental" in
/// Rust, so we have to use the potentially uglier `.file_stem` instead.
fn file_stem(file: &str) -> Result<&str> {
  Path::new(file)
    .file_stem()
    .and_then(|stem| stem.to_str())
    .ok_or_else(|| Error::InvalidFileName(file.to_string()))
}
