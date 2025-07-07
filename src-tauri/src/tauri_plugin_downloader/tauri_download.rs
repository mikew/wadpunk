use futures_util::TryStreamExt;
use serde::{ser::Serializer, Serialize};
// use tauri::ipc::Channel;
use tokio::{
  fs::File,
  io::{AsyncWriteExt, BufWriter},
};

use std::collections::HashMap;

use super::tauri_transfer_stats::TransferStats;

type Result<T> = std::result::Result<T, Error>;

#[derive(Debug, thiserror::Error)]
pub enum Error {
  #[error(transparent)]
  Io(#[from] std::io::Error),
  #[error(transparent)]
  Request(#[from] reqwest::Error),
  // #[error("{0}")]
  // ContentLength(String),
  #[error("request failed with status code {0}: {1}")]
  HttpErrorCode(u16, String),
}

impl Serialize for Error {
  fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
  where
    S: Serializer,
  {
    serializer.serialize_str(self.to_string().as_ref())
  }
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProgressPayload {
  progress: u64,
  progress_total: u64,
  total: u64,
  transfer_speed: u64,
}

pub async fn download(
  url: &str,
  file_path: &str,
  headers: HashMap<String, String>,
  body: Option<String>,
  // on_progress: Channel<ProgressPayload>,
) -> Result<()> {
  let client = reqwest::Client::new();
  let mut request = if let Some(body) = body {
    client.post(url).body(body)
  } else {
    client.get(url)
  };
  // Loop trought the headers keys and values
  // and add them to the request object.
  for (key, value) in headers {
    request = request.header(&key, value);
  }

  let response = request.send().await?;
  if !response.status().is_success() {
    return Err(Error::HttpErrorCode(
      response.status().as_u16(),
      response.text().await.unwrap_or_default(),
    ));
  }
  let total = response.content_length().unwrap_or(0);

  let mut file = BufWriter::new(File::create(file_path).await?);
  let mut stream = response.bytes_stream();

  let mut stats = TransferStats::default();
  while let Some(chunk) = stream.try_next().await? {
    file.write_all(&chunk).await?;
    stats.record_chunk_transfer(chunk.len());
    // let _ = on_progress.send(ProgressPayload {
    //   progress: chunk.len() as u64,
    //   progress_total: stats.total_transferred,
    //   total,
    //   transfer_speed: stats.transfer_speed,
    // });
  }
  file.flush().await?;

  Ok(())
}
