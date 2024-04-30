use crate::{database, graphql::generated::KnownSourcePort};

pub struct BuildCommandArgs {
  pub executable: String,
  pub iwad: String,
  pub files: Vec<String>,
  pub use_custom_config: bool,
  pub game_id: String,
}

pub enum DbKnownSourcePort {
  GZDoom,
  EternityEngine,
  ChocolateDoom,
  DSDA,
  Woof,
}

impl DbKnownSourcePort {
  pub fn id(&self) -> String {
    match self {
      Self::GZDoom => "gzdoom".to_string(),
      Self::EternityEngine => "eternity".to_string(),
      Self::ChocolateDoom => "chocolate-doom".to_string(),
      Self::DSDA => "dsda".to_string(),
      Self::Woof => "woof".to_string(),
    }
  }

  pub fn name(&self) -> String {
    match self {
      Self::GZDoom => "GZDoom".to_string(),
      Self::EternityEngine => "Eternity Engine".to_string(),
      Self::ChocolateDoom => "Chocolate Doom".to_string(),
      Self::DSDA => "DSDA".to_string(),
      Self::Woof => "Woof".to_string(),
    }
  }

  pub fn supports_custom_config(&self) -> bool {
    match self {
      Self::GZDoom => true,
      Self::EternityEngine => true,
      Self::ChocolateDoom => true,
      Self::DSDA => true,
      Self::Woof => true,
    }
  }

  pub fn supports_save_dir(&self) -> bool {
    match self {
      Self::GZDoom => true,
      Self::EternityEngine => true,
      Self::ChocolateDoom => true,
      Self::DSDA => true,
      Self::Woof => true,
    }
  }

  pub fn home_page_url(&self) -> String {
    match self {
      Self::GZDoom => "https://zdoom.org/".to_string(),
      Self::EternityEngine => "https://eternity.youfailit.net/wiki/Eternity_Engine".to_string(),
      Self::ChocolateDoom => "https://www.chocolate-doom.org/".to_string(),
      Self::DSDA => "https://github.com/kraflab/dsda-doom".to_string(),
      Self::Woof => "https://github.com/fabiangreffrath/woof".to_string(),
    }
  }

  pub fn download_page_url(&self) -> String {
    match self {
      Self::GZDoom => "https://github.com/ZDoom/gzdoom/releases".to_string(),
      Self::EternityEngine => {
        "https://github.com/team-eternity/eternity/releases/latest".to_string()
      }
      Self::ChocolateDoom => "https://www.chocolate-doom.org/wiki/index.php/Downloads".to_string(),
      Self::DSDA => {
        "https://drive.google.com/drive/folders/1KMU1dY0HZrY5h2EyPzxxXuyH8DunAJV_?usp=sharing"
          .to_string()
      }
      Self::Woof => "https://github.com/fabiangreffrath/woof/releases/latest".to_string(),
    }
  }

  pub fn to_known_source_port(&self) -> KnownSourcePort {
    KnownSourcePort {
      id: self.id(),
      name: self.name(),
      description: "".to_string(),
      supports_custom_config: self.supports_custom_config(),
      supports_save_dir: self.supports_save_dir(),
      home_page_url: self.home_page_url(),
      download_page_url: self.download_page_url(),
      example_command: self.build_command(&BuildCommandArgs {
        executable: self.id().to_string(),
        iwad: "doom2.iwad".to_string(),
        files: vec!["example.wad".to_string()],
        use_custom_config: true,
        game_id: "doom2".to_string(),
      }),
    }
  }

  pub fn build_command(&self, args: &BuildCommandArgs) -> Vec<String> {
    let mut command = vec![args.executable.clone()];

    if args.use_custom_config {
      let config_path = database::get_meta_directory()
        .join(database::normalize_name_from_id(&args.game_id))
        .join("config.ini")
        .to_str()
        .unwrap()
        .to_string();

      match self {
        Self::GZDoom | Self::EternityEngine | Self::ChocolateDoom | Self::DSDA | Self::Woof => {
          command.push("-config".to_string());
          command.push(config_path);
        }
      }
    }

    let save_dir = database::get_meta_directory()
      .join(database::normalize_name_from_id(&args.game_id))
      .join("saves")
      .to_str()
      .unwrap()
      .to_string();
    match self {
      Self::GZDoom | Self::ChocolateDoom => {
        command.push("-savedir".to_string());
        command.push(save_dir);
      }
      Self::EternityEngine | Self::DSDA | Self::Woof => {
        command.push("-save".to_string());
        command.push(save_dir);
      }
    }

    command.push("-iwad".to_string());
    command.push(args.iwad.clone());

    for file in &args.files {
      // If the file ends with .deh, add `-deh <file>`, if the file ends with
      // .bex, add `-bex <file>`, otherwise just add `-file <file>`
      if file.ends_with(".deh") {
        match self {
          Self::GZDoom | Self::EternityEngine | Self::ChocolateDoom | Self::DSDA | Self::Woof => {
            command.push("-deh".to_string());
            command.push(file.clone());
          }
        }
      } else if file.ends_with(".bex") {
        match self {
          Self::GZDoom | Self::EternityEngine | Self::ChocolateDoom | Self::DSDA | Self::Woof => {
            command.push("-deh".to_string());
            command.push(file.clone());
          }
        }
      } else {
        match self {
          Self::GZDoom | Self::EternityEngine | Self::DSDA | Self::Woof => {
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

    command
  }
}

pub fn get_all_known_source_ports() -> Vec<DbKnownSourcePort> {
  vec![
    DbKnownSourcePort::GZDoom,
    DbKnownSourcePort::EternityEngine,
    DbKnownSourcePort::ChocolateDoom,
    DbKnownSourcePort::DSDA,
    DbKnownSourcePort::Woof,
  ]
}

pub fn find_known_source_port_from_id(id: &str) -> DbKnownSourcePort {
  for source_port in get_all_known_source_ports() {
    if source_port.id() == id {
      return source_port;
    }
  }

  DbKnownSourcePort::GZDoom
}
