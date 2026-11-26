use std::path::Path;
use std::process::Command;

use chrono::Utc;

use crate::database;
use crate::database::DbPlaySessionEntry;
use crate::database::DbPreviousFileStateItem;
use crate::database::DbSourcePort;
use crate::error::describe_exit_status;
use crate::error::Error;
use crate::error::Result;
use crate::known_source_ports;
use crate::known_source_ports::BuildCommandArgs;

pub fn start_game(game_id: &str) -> Result<()> {
  let game = database::find_game_by_id(game_id)?;

  let db_source_port = resolve_source_port(game_id, game.source_port.as_deref())?;
  let (program, base_args) = source_port_command(&db_source_port)?;
  let executable = resolve_executable(program)?;

  let source_port_definition = db_source_port
    .known_source_port_id
    .as_deref()
    .map(known_source_ports::find_known_source_port_from_id)
    .unwrap_or_else(known_source_ports::get_starter_source_port);

  // If this game is tagged as an IWAD, it provides its own IWAD, otherwise use
  // the configured one.
  let is_game_iwad = game
    .tags
    .iter()
    .flatten()
    .any(|tag| tag.to_lowercase() == "iwad");
  let iwad_id = if is_game_iwad {
    game_id
  } else {
    game
      .iwad_id
      .as_deref()
      .ok_or_else(|| Error::GameNotConfigured {
        game: game_id.to_string(),
        missing: "IWAD configured",
      })?
  };

  let (iwad, files) =
    collect_enabled_files(game_id, iwad_id, game.previous_file_state.iter().flatten())?;

  let built_args = source_port_definition.build_args(&BuildCommandArgs {
    game_id,
    iwad: &iwad,
    files: &files,
    use_custom_config: game.use_custom_config.unwrap_or_default(),
  })?;

  let mut command = Command::new(&executable);

  // Set LD_LIBRARY_PATH for Linux / AppImage.
  if cfg!(target_os = "linux") {
    let ld_library_path = std::env::var("LD_LIBRARY_PATH").unwrap_or_default();
    command.env("LD_LIBRARY_PATH", format!("/usr/lib:{}", ld_library_path));
  }

  command.args(base_args);
  command.args(&built_args);

  let started_at = Utc::now().to_rfc3339();

  let exit_status = command.status().map_err(|source| Error::Launch {
    program: executable.clone(),
    source,
  })?;

  let play_session = DbPlaySessionEntry {
    started_at: Some(started_at),
    ended_at: Some(Utc::now().to_rfc3339()),
    passive: Some(false),
  };

  let record = |id: &str, entry: &DbPlaySessionEntry| {
    if let Err(error) = database::record_game_play_session(id, entry) {
      eprintln!("Could not record play session for {}: {}", id, error);
    }
  };

  record(game_id, &play_session);

  let passive_play_session = DbPlaySessionEntry {
    passive: Some(true),
    ..play_session.clone()
  };

  for id in game
    .iwad_id
    .iter()
    .chain(game.extra_mod_ids.iter().flatten())
  {
    record(id, &passive_play_session);
  }

  if !exit_status.success() {
    return Err(Error::GameExited {
      name: source_port_definition.name(),
      outcome: describe_exit_status(exit_status),
    });
  }

  Ok(())
}

fn resolve_source_port(game_id: &str, configured: Option<&str>) -> Result<DbSourcePort> {
  match configured {
    Some("-1") => {
      let mut first = None;

      for source_port in database::find_all_source_ports()? {
        if source_port.is_default == Some(true) {
          return Ok(source_port);
        }

        first.get_or_insert(source_port);
      }

      first.ok_or(Error::NoSourcePorts)
    }

    Some(source_port_id) => database::find_source_port_by_id(source_port_id),

    None => Err(Error::GameNotConfigured {
      game: game_id.to_string(),
      missing: "source port configured",
    }),
  }
}

fn source_port_command(db_source_port: &DbSourcePort) -> Result<(&str, &[String])> {
  db_source_port
    .command
    .as_deref()
    .and_then(|command| command.split_first())
    .map(|(program, base_args)| (program.as_str(), base_args))
    .ok_or_else(|| Error::EmptySourcePortCommand(db_source_port.id.clone().unwrap_or_default()))
}

/// On macOS, if `${program}/Contents/Info.plist` exists, `program` is an app
/// bundle. We need to get `CFBundleExecutable` from the plist and run
/// `${program}/Contents/MacOS/${CFBundleExecutable}`.
fn resolve_executable(program: &str) -> Result<String> {
  let plist_path = Path::new(program).join("Contents").join("Info.plist");

  if !cfg!(target_os = "macos") || !plist_path.exists() {
    return Ok(program.to_string());
  }

  let info_plist = plist::Value::from_file(&plist_path).map_err(|source| Error::Plist {
    path: plist_path.clone(),
    source,
  })?;

  let executable = info_plist
    .as_dictionary()
    .and_then(|x| x.get("CFBundleExecutable"))
    .and_then(|x| x.as_string())
    .ok_or(Error::MissingBundleExecutable(plist_path))?;

  let executable_path = Path::new(program)
    .join("Contents")
    .join("MacOS")
    .join(executable);

  Ok(database::path_to_str(&executable_path)?.to_string())
}

fn collect_enabled_files<'a>(
  game_id: &str,
  iwad_id: &str,
  previous_file_state: impl Iterator<Item = &'a DbPreviousFileStateItem>,
) -> Result<(String, Vec<String>)> {
  let mut files = vec![];
  let mut iwad = None;

  for file in previous_file_state.filter(|item| item.is_enabled) {
    if iwad.is_none() && file.relative.starts_with(iwad_id) {
      iwad = Some(file.absolute.clone());
    }

    files.push(file.absolute.clone());
  }

  let iwad = iwad.ok_or_else(|| Error::GameNotConfigured {
    game: game_id.to_string(),
    missing: "enabled IWAD files",
  })?;

  Ok((iwad, files))
}
