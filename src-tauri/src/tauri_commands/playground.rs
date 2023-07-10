#[tauri::command]
pub fn greet(name: &str) -> Result<String, String> {
  return Ok(format!("Hello, {}! You've been greeted from Rust!", name));
}
