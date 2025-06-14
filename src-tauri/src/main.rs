#![allow(non_snake_case)]
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

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
      Ok(())
    })
    .plugin(tauri_plugin_graphql::init(schema))
    .plugin(tauri_plugin_window_state::Builder::default().build())
    .plugin(tauri_plugin_process::init())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_cli::init())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
