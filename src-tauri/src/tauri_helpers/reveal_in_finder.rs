#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
#[cfg(target_os = "linux")]
use std::path::Path;
use std::{fs::metadata, process::Command};

// https://github.com/tauri-apps/tauri/issues/4062#issuecomment-1338048169
pub fn reveal_file(path: &str) {
  #[cfg(target_os = "windows")]
  {
    // TODO Try to use `raw_arg` instead of `arg` and `args` to avoid issues.
    // https://doc.rust-lang.org/std/os/windows/process/trait.CommandExt.html#tymethod.raw_arg
    Command::new("explorer.exe")
        // The comma after select is not a typo
        .raw_arg(format!("/select,{path}").as_str())
        .spawn()
        .unwrap();
  }

  #[cfg(target_os = "linux")]
  {
    // You cannot use dbus-send to "reveal" a file whose path contains a
    // comma.
    // https://gitlab.freedesktop.org/dbus/dbus/-/issues/76
    if path.contains(",") {
      reveal_folder(Path::new(path).parent().unwrap().to_str().unwrap());
    } else {
      Command::new("dbus-send")
        .args([
          // This --print-reply seems ... vital? Without it nothing happens.
          "--print-reply",
          "--dest=org.freedesktop.FileManager1",
          "/org/freedesktop/FileManager1",
          "org.freedesktop.FileManager1.ShowItems",
          format!("array:string:{path}").as_str(),
          "string:",
        ])
        .spawn()
        .unwrap();
    }
  }

  #[cfg(target_os = "macos")]
  {
    Command::new("open")
      .args(["--reveal", "--", path])
      .spawn()
      .unwrap();
  }
}

pub fn reveal_folder(path: &str) {
  #[cfg(target_os = "windows")]
  {
    Command::new("explorer").arg(path).spawn().unwrap();
  }

  #[cfg(target_os = "linux")]
  {
    Command::new("xdg-open").arg(path).spawn().unwrap();
  }

  #[cfg(target_os = "macos")]
  {
    Command::new("open").arg(path).spawn().unwrap();
  }
}

pub fn reveal_file_or_folder(path: &str) {
  // Sometimes there is a forward slash at the end of the path, which causes
  // issues on some platforms.
  let path = if path.ends_with('/') {
    &path[..path.len() - 1]
  } else {
    path
  };

  if metadata(path).unwrap().is_dir() {
    reveal_folder(path);
  } else {
    reveal_file(path);
  }
}
