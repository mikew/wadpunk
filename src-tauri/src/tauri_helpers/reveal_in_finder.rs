#[cfg(target_os = "linux")]
use fork::{daemon, Fork};
#[cfg(target_os = "linux")]
use std::path::PathBuf;
#[cfg(target_os = "linux")]
use std::{fs::metadata, path::PathBuf};
use std::{fs::metadata, process::Command}; // dep: fork = "0.1"

// https://github.com/tauri-apps/tauri/issues/4062#issuecomment-1338048169
pub fn reveal_file(path: String) {
  #[cfg(target_os = "windows")]
  {
    Command::new("explorer")
        // The comma after select is not a typo
        .args(["/select,", &path])
        .spawn()
        .unwrap();
  }

  #[cfg(target_os = "linux")]
  {
    if path.contains(",") {
      // see https://gitlab.freedesktop.org/dbus/dbus/-/issues/76
      let new_path = match metadata(&path).unwrap().is_dir() {
        true => path,
        false => {
          let mut path2 = PathBuf::from(path);
          path2.pop();
          path2.into_os_string().into_string().unwrap()
        }
      };
      Command::new("xdg-open").arg(&new_path).spawn().unwrap();
    } else {
      // if let Ok(Fork::Child) = daemon(false, false) {
      Command::new("dbus-send")
        .args([
          "--session",
          "--dest=org.freedesktop.FileManager1",
          "--type=method_call",
          "/org/freedesktop/FileManager1",
          "org.freedesktop.FileManager1.ShowItems",
          format!("array:string:\"file://{path}\"").as_str(),
          "string:\"\"",
        ])
        .spawn()
        .unwrap();
      // }
    }
  }

  #[cfg(target_os = "macos")]
  {
    Command::new("open").args(["-R", &path]).spawn().unwrap();
  }
}

pub fn reveal_folder(path: String) {
  #[cfg(target_os = "windows")]
  {
    Command::new("explorer").arg(&path).spawn().unwrap();
  }

  #[cfg(target_os = "linux")]
  {
    Command::new("xdg-open").arg(&path).spawn().unwrap();
  }

  #[cfg(target_os = "macos")]
  {
    Command::new("open").arg(&path).spawn().unwrap();
  }
}

pub fn reveal_file_or_folder(path: String) {
  if metadata(path.clone()).unwrap().is_dir() {
    reveal_folder(path);
  } else {
    reveal_file(path);
  }
}
