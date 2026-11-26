use crate::{database, error::Result, graphql::generated::KnownSourcePort};

pub struct BuildCommandArgs<'a> {
  pub iwad: &'a str,
  pub files: &'a [String],
  pub use_custom_config: bool,
  pub game_id: &'a str,
}

pub enum DbKnownSourcePort {
  GZDoom,
  EternityEngine,
  ChocolateDoom,
  Dsda,
  Helion,
  Woof,
  Zandronum,
  UZDoom,
}

impl DbKnownSourcePort {
  pub fn id(&self) -> &'static str {
    match self {
      Self::GZDoom => "gzdoom",
      Self::EternityEngine => "eternity",
      Self::ChocolateDoom => "chocolate-doom",
      Self::Dsda => "dsda",
      Self::Helion => "helion",
      Self::Woof => "woof",
      Self::Zandronum => "zandronum",
      Self::UZDoom => "uzdoom",
    }
  }

  pub fn name(&self) -> &'static str {
    match self {
      Self::GZDoom => "GZDoom",
      Self::EternityEngine => "Eternity Engine",
      Self::ChocolateDoom => "Chocolate Doom",
      Self::Dsda => "DSDA",
      Self::Helion => "Helion",
      Self::Woof => "Woof",
      Self::Zandronum => "Zandronum",
      Self::UZDoom => "UZDoom",
    }
  }

  pub fn supports_custom_config(&self) -> bool {
    match self {
      Self::GZDoom => true,
      Self::EternityEngine => true,
      Self::ChocolateDoom => true,
      Self::Dsda => true,
      Self::Helion => true,
      Self::Woof => true,
      Self::Zandronum => true,
      Self::UZDoom => true,
    }
  }

  pub fn supports_save_dir(&self) -> bool {
    match self {
      Self::GZDoom => true,
      Self::EternityEngine => true,
      Self::ChocolateDoom => true,
      Self::Dsda => true,
      Self::Helion => true,
      Self::Woof => true,
      Self::Zandronum => true,
      Self::UZDoom => true,
    }
  }

  pub fn home_page_url(&self) -> &'static str {
    match self {
      Self::GZDoom => "https://zdoom.org/",
      Self::EternityEngine => "https://eternity.youfailit.net/wiki/Eternity_Engine",
      Self::ChocolateDoom => "https://www.chocolate-doom.org/",
      Self::Dsda => "https://github.com/kraflab/dsda-doom",
      Self::Helion => "https://github.com/Helion-Engine/Helion",
      Self::Woof => "https://github.com/fabiangreffrath/woof",
      Self::Zandronum => "https://zandronum.com/",
      Self::UZDoom => "https://github.com/UZDoom/UZDoom",
    }
  }

  pub fn download_page_url(&self) -> &'static str {
    match self {
      Self::GZDoom => "https://github.com/ZDoom/gzdoom/releases/latest",
      Self::EternityEngine => "https://github.com/team-eternity/eternity/releases/latest",
      Self::ChocolateDoom => "https://www.chocolate-doom.org/wiki/index.php/Downloads",
      Self::Dsda => {
        "https://drive.google.com/drive/folders/1KMU1dY0HZrY5h2EyPzxxXuyH8DunAJV_?usp=sharing"
      }
      Self::Helion => "https://github.com/Helion-Engine/Helion/releases/latest",
      Self::Woof => "https://github.com/fabiangreffrath/woof/releases/latest",
      Self::Zandronum => "https://zandronum.com/download",
      Self::UZDoom => "https://github.com/UZDoom/UZDoom/releases/latest",
    }
  }

  pub fn to_known_source_port(&self) -> Result<KnownSourcePort> {
    let example_files =
      ["example1.wad", "example2.wad", "myfile.deh", "myfile.bex"].map(String::from);

    Ok(KnownSourcePort {
      id: self.id().to_string(),
      name: self.name().to_string(),
      supports_custom_config: self.supports_custom_config(),
      supports_save_dir: self.supports_save_dir(),
      home_page_url: self.home_page_url().to_string(),
      download_page_url: self.download_page_url().to_string(),
      example_command: [self.id().to_string()]
        .into_iter()
        .chain(self.build_args(&BuildCommandArgs {
          iwad: "doom2.iwad",
          files: &example_files,
          use_custom_config: true,
          game_id: "doom2",
        })?)
        .collect(),
    })
  }

  pub fn build_args(&self, args: &BuildCommandArgs) -> Result<Vec<String>> {
    let mut command = vec![];
    let game_meta_directory =
      database::get_meta_directory()?.join(database::normalize_name_from_id(args.game_id));

    if args.use_custom_config {
      let config_path = database::path_to_str(&game_meta_directory.join("config.ini"))?.to_string();

      match self {
        Self::GZDoom
        | Self::EternityEngine
        | Self::ChocolateDoom
        | Self::Dsda
        | Self::Helion
        | Self::Woof
        | Self::Zandronum
        | Self::UZDoom => {
          command.push("-config".to_string());
          command.push(config_path);
        }
      }
    }

    let save_dir = database::path_to_str(&game_meta_directory.join("saves"))?.to_string();
    match self {
      Self::GZDoom | Self::ChocolateDoom | Self::Zandronum | Self::Helion | Self::UZDoom => {
        command.push("-savedir".to_string());
        command.push(save_dir);
      }
      Self::EternityEngine | Self::Dsda | Self::Woof => {
        command.push("-save".to_string());
        command.push(save_dir);
      }
    }

    command.push("-iwad".to_string());
    command.push(args.iwad.to_string());

    for file in args.files {
      // If the file ends with .deh, add `-deh <file>`, if the file ends with
      // .bex, add `-bex <file>`, otherwise just add `-file <file>`
      if file.ends_with(".deh") {
        match self {
          Self::GZDoom
          | Self::EternityEngine
          | Self::ChocolateDoom
          | Self::Dsda
          | Self::Helion
          | Self::Woof
          | Self::Zandronum
          | Self::UZDoom => {
            command.push("-deh".to_string());
            command.push(file.clone());
          }
        }
      } else if file.ends_with(".bex") {
        match self {
          Self::GZDoom
          | Self::EternityEngine
          | Self::ChocolateDoom
          | Self::Dsda
          | Self::Helion
          | Self::Woof
          | Self::Zandronum
          | Self::UZDoom => {
            command.push("-deh".to_string());
            command.push(file.clone());
          }
        }
      } else {
        match self {
          Self::GZDoom
          | Self::EternityEngine
          | Self::Dsda
          | Self::Helion
          | Self::Woof
          | Self::Zandronum
          | Self::UZDoom => {
            command.push("-file".to_string());
            command.push(file.clone());
          }
          Self::ChocolateDoom => {
            command.push("-merge".to_string());
            command.push(file.clone());
          }
        }
      }
    }

    Ok(command)
  }
}

pub fn get_all_known_source_ports() -> [DbKnownSourcePort; 8] {
  [
    DbKnownSourcePort::GZDoom,
    DbKnownSourcePort::EternityEngine,
    DbKnownSourcePort::ChocolateDoom,
    DbKnownSourcePort::Dsda,
    DbKnownSourcePort::Helion,
    DbKnownSourcePort::Woof,
    DbKnownSourcePort::Zandronum,
    DbKnownSourcePort::UZDoom,
  ]
}

pub fn find_known_source_port_from_id(id: &str) -> DbKnownSourcePort {
  get_all_known_source_ports()
    .into_iter()
    .find(|source_port| source_port.id() == id)
    .unwrap_or_else(get_starter_source_port)
}

pub fn get_starter_source_port() -> DbKnownSourcePort {
  DbKnownSourcePort::UZDoom
}
