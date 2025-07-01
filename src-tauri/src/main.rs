#![allow(non_snake_case)]
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Emitter;
use tauri::Manager;
use tauri_plugin_cli::CliExt;

use graphql::datasource::DataSource;

mod database;
mod graphql;
mod importer;
mod known_source_ports;
mod tauri_helpers;
mod tauri_legacy;

fn main() {
  let schema = async_graphql::Schema::build(
    graphql::generated::Query,
    graphql::generated::Mutation,
    async_graphql::EmptySubscription,
  )
  .data(DataSource)
  .finish();

  tauri::Builder::default()
    .setup(|app| {
      crate::tauri_legacy::set_app_handle(app.handle().clone());
      #[cfg(any(windows, target_os="linux"))]
      {
        use tauri_plugin_deep_link::DeepLinkExt;
        let _ = app.deep_link().register_all();
      }
      Ok(())
    })
    .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
      #[cfg(desktop)]
      {
        let _ = app
          .get_webview_window("main")
          .expect("no main window")
          .set_focus();

        let matches = app.cli().matches_from(args);
        match matches {
          Ok(matches) => {
            let _ = app.emit_to("main", "cli", matches);
          }
          Err(e) => {
            eprintln!("Error parsing CLI arguments: {}", e);
          }
        }
      }
    }))
    // break
    .plugin(tauri_plugin_window_state::Builder::default().build())
    .plugin(tauri_plugin_graphql::init(schema))
    .plugin(tauri_plugin_updater::Builder::new().build())
    // break
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_process::init())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_deep_link::init())
    .plugin(tauri_plugin_cli::init())
    // break
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
