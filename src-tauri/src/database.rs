use std::fs;
use std::path::Path;
use std::path::PathBuf;

use chrono::DateTime;
use chrono::Utc;
use serde::{Deserialize, Serialize};

use crate::error::Error;
use crate::error::Result;
use crate::graphql::generated::Game;
use crate::graphql::generated::ModSet;
use crate::graphql::generated::SourcePort;
use crate::json_file::read_json;
use crate::json_file::read_json_or_default;
use crate::json_file::write_json;
use crate::known_source_ports;
use crate::tauri_legacy::{document_dir, home_dir, read_dir, DiskEntry};

pub fn get_data_directory() -> Result<PathBuf> {
  let documents_directory = match document_dir() {
    Ok(directory) => directory,
    Err(_) => home_dir()
      .map_err(Error::NoDocumentsDirectory)?
      .join("Documents"),
  };

  Ok(documents_directory.join("WADPunk"))
}

pub fn get_games_directory() -> Result<PathBuf> {
  Ok(get_data_directory()?.join("Games"))
}

pub fn get_source_ports_directory() -> Result<PathBuf> {
  Ok(get_data_directory()?.join("SourcePorts"))
}

pub fn get_meta_directory() -> Result<PathBuf> {
  Ok(get_data_directory()?.join("Meta"))
}

pub fn get_mod_sets_file() -> Result<PathBuf> {
  Ok(get_data_directory()?.join("mod_sets.json"))
}

pub fn path_to_str(path: &Path) -> Result<&str> {
  path
    .to_str()
    .ok_or_else(|| Error::NotUtf8Path(path.to_path_buf()))
}

pub fn init_games() -> Result<()> {
  for directory in [
    get_games_directory()?,
    get_source_ports_directory()?,
    get_meta_directory()?,
  ] {
    fs::create_dir_all(&directory).map_err(Error::io("create folder", &directory))?;
  }

  if !get_mod_sets_file()?.exists() {
    save_mod_sets(&[])?;
  }

  Ok(())
}

pub fn find_all_games() -> Result<Vec<DbGameMeta>> {
  let mut db_games: Vec<DbGameMeta> = vec![];

  for game_disk_entry in read_dir(&get_games_directory()?, false)? {
    let game_id = game_disk_entry.name;

    if game_id.starts_with(".") {
      continue;
    }

    match load_game_meta(&game_id) {
      Ok(db_game) => db_games.push(db_game),
      Err(error) => eprintln!("Skipping game {}: {}", game_id, error),
    }
  }

  Ok(db_games)
}

pub fn normalize_name_from_id(id: &str) -> &str {
  id.strip_suffix("/").unwrap_or(id)
}

pub fn load_game_meta(game_id: &str) -> Result<DbGameMeta> {
  let json_meta_path = get_meta_directory()?.join(game_id).join("meta.json");

  let mut db_game_meta = match read_json::<DbGameMeta>(&json_meta_path)? {
    Some(db_game_meta) => db_game_meta,
    None => {
      let db_game = DbGameMeta {
        id: Some(game_id.to_string()),
        name: Some(normalize_name_from_id(game_id).to_string()),
        rating: None,
        description: None,
        notes: None,
        tags: None,
        iwad_id: None,
        source_port: None,
        extra_mod_ids: None,
        previous_file_state: None,
        use_custom_config: None,

        installed_at: Some(Utc::now().to_rfc3339()),
      };

      save_game(&db_game)?;
      db_game
    }
  };

  // Intentionally never use the id from the file, use whatever is being passed
  // around.
  db_game_meta.id = Some(game_id.to_string());

  if db_game_meta.name.is_none() {
    db_game_meta.name = Some(normalize_name_from_id(game_id).to_string());
  }

  Ok(db_game_meta)
}

pub fn load_game_play_sessions(game_id: &str) -> Result<DbPlaySession> {
  let path = get_meta_directory()?
    .join(game_id)
    .join("playSessions.json");

  read_json_or_default(&path)
}

pub fn record_game_play_session(
  game_id: &str,
  db_play_session_entry: &DbPlaySessionEntry,
) -> Result<()> {
  let path = get_meta_directory()?
    .join(game_id)
    .join("playSessions.json");

  let mut db_play_sessions = read_json_or_default::<DbPlaySession>(&path)?;
  db_play_sessions
    .sessions
    .get_or_insert_with(Vec::new)
    .push(db_play_session_entry.clone());

  write_json(&path, &db_play_sessions)
}

pub fn find_all_game_files(game_id: &str) -> Result<Vec<String>> {
  let game_path = get_games_directory()?.join(game_id);

  if !game_id.ends_with("/") {
    return Ok(vec![path_to_str(&game_path)?.to_string()]);
  }

  let mut files: Vec<String> = vec![];

  for file_disk_entry in read_dir(&game_path, true)? {
    recurse_disk_entry(file_disk_entry, &mut files)?;
  }

  Ok(files)
}

pub fn find_game_by_id(id: &str) -> Result<DbGameMeta> {
  let game_path = get_games_directory()?.join(normalize_name_from_id(id));

  if !game_path.exists() {
    return Err(Error::not_found("game", id));
  }

  load_game_meta(id)
}

pub fn save_game(db_game: &DbGameMeta) -> Result<()> {
  let id = db_game.id.as_deref().ok_or(Error::MissingId("game"))?;
  let json_meta_path = get_meta_directory()?
    .join(normalize_name_from_id(id))
    .join("meta.json");

  write_json(&json_meta_path, db_game)
}

pub fn find_all_source_ports() -> Result<Vec<DbSourcePort>> {
  let mut db_source_ports: Vec<DbSourcePort> = vec![];

  for source_port_disk_entry in read_dir(&get_source_ports_directory()?, false)? {
    let name = source_port_disk_entry.name;

    if name.starts_with(".") {
      continue;
    }

    let Some(source_port_id) = name.strip_suffix(".json") else {
      continue;
    };

    match find_source_port_by_id(source_port_id) {
      Ok(db_source_port) => db_source_ports.push(db_source_port),
      Err(error) => eprintln!("Skipping source port {}: {}", source_port_id, error),
    }
  }

  Ok(db_source_ports)
}

pub fn find_source_port_by_id(source_port_id: &str) -> Result<DbSourcePort> {
  let json_path = get_source_ports_directory()?.join(format!("{}.json", source_port_id));

  let mut db_source_port = read_json::<DbSourcePort>(&json_path)?
    .ok_or_else(|| Error::not_found("source port", source_port_id))?;

  db_source_port.id = Some(source_port_id.to_string());

  Ok(db_source_port)
}

pub fn save_source_port(db_source_port: &DbSourcePort) -> Result<()> {
  let id = db_source_port
    .id
    .as_deref()
    .ok_or(Error::MissingId("source port"))?;
  let json_path = get_source_ports_directory()?.join(format!("{}.json", id));

  write_json(&json_path, db_source_port)
}

pub fn delete_source_port(id: &str) -> Result<()> {
  let json_path = get_source_ports_directory()?.join(format!("{}.json", id));

  fs::remove_file(&json_path).map_err(Error::io("delete", &json_path))
}

pub fn set_default_source_port(id: &str, is_default: Option<bool>) -> Result<()> {
  if is_default != Some(true) {
    return Ok(());
  }

  for mut source_port in find_all_source_ports()? {
    source_port.is_default = Some(source_port.id.as_deref() == Some(id));

    save_source_port(&source_port)?;
  }

  Ok(())
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub struct DbModSet {
  pub name: Option<String>,
  pub mods: Option<Vec<String>>,
}

impl DbModSet {
  pub fn to_mod_set(&self) -> ModSet {
    ModSet {
      name: self.name.clone().unwrap_or_default(),
      mods: self.mods.clone().unwrap_or_default(),
    }
  }
}

pub fn find_all_mod_sets() -> Result<Vec<DbModSet>> {
  read_json_or_default(&get_mod_sets_file()?)
}

pub fn save_mod_sets(mod_sets: &[DbModSet]) -> Result<()> {
  write_json(&get_mod_sets_file()?, mod_sets)
}

pub fn save_mod_set(mod_set: DbModSet) -> Result<()> {
  let mut mod_sets = find_all_mod_sets()?;

  if let Some(index) = mod_sets.iter().position(|x| x.name == mod_set.name) {
    mod_sets[index] = mod_set;
  } else {
    mod_sets.push(mod_set);
  }

  save_mod_sets(&mod_sets)
}

pub fn delete_mod_set(name: &str) -> Result<()> {
  let mut mod_sets = find_all_mod_sets()?;
  mod_sets.retain(|x| x.name.as_deref() != Some(name));
  save_mod_sets(&mod_sets)
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub struct DbGameMeta {
  pub id: Option<String>,
  pub name: Option<String>,
  pub rating: Option<i32>,
  pub description: Option<String>,
  pub notes: Option<String>,
  pub tags: Option<Vec<String>>,

  pub iwad_id: Option<String>,
  pub source_port: Option<String>,
  pub extra_mod_ids: Option<Vec<String>>,
  pub previous_file_state: Option<Vec<DbPreviousFileStateItem>>,

  pub use_custom_config: Option<bool>,
  pub installed_at: Option<String>,
}

impl DbGameMeta {
  pub fn into_game(self) -> Result<Game> {
    Ok(Game {
      id: self.id.ok_or(Error::MissingId("game"))?,
      name: self.name.unwrap_or_default(),
      rating: self.rating.unwrap_or_default(),
      description: self.description.unwrap_or_default(),
      notes: self.notes.unwrap_or_default(),
      tags: self.tags.unwrap_or_default(),

      iwad_id: Some(self.iwad_id.unwrap_or_default()),
      source_port: Some(self.source_port.unwrap_or_default()),
      extra_mod_ids: Some(self.extra_mod_ids.unwrap_or_default()),
      // previous_file_state: self.previous_file_state.unwrap_or_default(),
      use_custom_config: self.use_custom_config.unwrap_or_default(),
      installed_at: self
        .installed_at
        .unwrap_or_else(|| DateTime::<Utc>::UNIX_EPOCH.to_rfc3339()),
    })
  }
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub struct DbPreviousFileStateItem {
  pub is_enabled: bool,
  pub relative: String,
  pub absolute: String,
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub struct DbPlaySession {
  pub sessions: Option<Vec<DbPlaySessionEntry>>,
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub struct DbPlaySessionEntry {
  pub started_at: Option<String>,
  pub ended_at: Option<String>,
  pub passive: Option<bool>,
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub struct DbSourcePort {
  pub id: Option<String>,
  pub command: Option<Vec<String>>,
  pub known_source_port_id: Option<String>,
  pub is_default: Option<bool>,
}

impl DbSourcePort {
  pub fn into_source_port(self) -> Result<SourcePort> {
    Ok(SourcePort {
      id: self.id.ok_or(Error::MissingId("source port"))?,
      command: self.command.unwrap_or_default(),
      known_source_port_id: self.known_source_port_id.unwrap_or_else(|| {
        known_source_ports::get_starter_source_port()
          .id()
          .to_string()
      }),
      is_default: self.is_default.unwrap_or_default(),
    })
  }
}

fn recurse_disk_entry(dir: DiskEntry, files: &mut Vec<String>) -> Result<()> {
  if let Some(children) = dir.children {
    for d in children {
      recurse_disk_entry(d, files)?;
    }
  } else if !dir.name.starts_with(".") {
    files.push(path_to_str(&dir.path)?.to_string());
  }

  Ok(())
}
