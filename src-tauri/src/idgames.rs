use std::collections::HashMap;
use std::path::Path;
use std::path::PathBuf;

use crate::database;
use crate::error::Error;
use crate::error::Result;
use crate::tauri_plugin_downloader::tauri_download::download;

const API_NAME: &str = "idgames";

pub async fn download_to_temp_dir(id: &str) -> Result<PathBuf> {
  let response = reqwest::Client::new()
    .get("https://www.doomworld.com/idgames/api/api.php")
    .query(&[("action", "get"), ("id", id)])
    .send()
    .await
    .map_err(network_error)?;

  if !response.status().is_success() {
    return Err(unexpected_response(format!("status {}", response.status())));
  }

  // It's XML, and we need to get `idgames-response.content.dir` and
  // `idgames-response.content.filename`.
  let xml_content = response.text().await.map_err(network_error)?;
  let doc = roxmltree::Document::parse(&xml_content)
    .map_err(|error| unexpected_response(error.to_string()))?;

  let find_text = |tag: &str| {
    doc
      .descendants()
      .find(|node| node.has_tag_name(tag))
      .and_then(|node| node.text())
      .ok_or_else(|| unexpected_response(format!("it has no '{}'", tag)))
  };
  let dir = find_text("dir")?;
  let file = find_text("filename")?;

  // The name comes from a remote server, so only ever use the last part of it
  // as a local file name.
  let file_name = Path::new(file)
    .file_name()
    .ok_or_else(|| Error::InvalidFileName(file.to_string()))?;

  // The download URL is `https://youfailit.net/pub/idgames/<dir>/<file>`
  let download_url = format!("https://youfailit.net/pub/idgames/{}/{}", dir, file);

  let temp_dir = mktemp::Temp::new_dir().map_err(Error::TempDir)?;
  let download_path = temp_dir.release().join(file_name);

  download(
    &download_url,
    database::path_to_str(&download_path)?,
    HashMap::new(),
    None,
  )
  .await
  .map_err(|source| Error::Download {
    url: download_url,
    source,
  })?;

  Ok(download_path)
}

fn network_error(source: reqwest::Error) -> Error {
  Error::Network {
    what: API_NAME,
    source,
  }
}

fn unexpected_response(detail: String) -> Error {
  Error::UnexpectedResponse {
    from: API_NAME,
    detail,
  }
}
