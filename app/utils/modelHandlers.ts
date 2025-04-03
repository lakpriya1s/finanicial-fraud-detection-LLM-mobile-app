import * as FileSystem from "expo-file-system";
import { Pipeline } from "react-native-transformers";

export const loadModel = async (
  preset: {
    name: string;
    model: string;
    onnx_path: string;
    options?: any;
  },
  setProgress: (progress: number) => void,
  onComplete: () => void
) => {
  console.log("Loading...");

  let name = preset.name;

  // Function to get the file count from Hugging Face
  const getFileCount = async (modelId: string): Promise<number> => {
    try {
      const response = await fetch(`https://huggingface.co/api/models/${modelId}`);
      if (!response.ok) {
        console.error(`Failed to fetch model metadata for ${modelId}`);
        return 0;
      }
      const data = await response.json();
      return data.siblings ? data.siblings.length : 0;
    } catch (error) {
      console.error("Error fetching file count:", error);
      return 0;
    }
  };

  // Fetch file count before downloading
  const fileCount = await getFileCount(preset.model);
  console.log(`Total files to download for ${preset.model}: ${fileCount}`);

  if (fileCount === 0) {
    console.warn(`No files to download for ${preset.model}`);
    setProgress(1); // Set progress to 100% if no files
    onComplete();
    return;
  }

  let downloadedFiles = 0;

  // Fetch with caching and file-based progress tracking
  const fetchWithCache = async (url: string) => {
    const localDir = FileSystem.cacheDirectory + `${name}/`;
    const localPath = localDir + url.split("/").pop()!;

    const dirInfo = await FileSystem.getInfoAsync(localDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(localDir, { intermediates: true });
    }

    const fileInfo = await FileSystem.getInfoAsync(localPath);
    if (fileInfo.exists) {
      console.log("File exists locally: " + localPath);
      downloadedFiles++;
      setProgress(downloadedFiles / fileCount);
      return localPath;
    }

    console.log("Downloading... " + url);
    const downloadResumable = FileSystem.createDownloadResumable(
      url,
      localPath,
      {},
      (progress) => {
        setProgress(progress.totalBytesWritten / progress.totalBytesExpectedToWrite);
        console.log("progress", progress.totalBytesWritten / progress.totalBytesExpectedToWrite);
      }
    );

    const result = await downloadResumable.downloadAsync();
    if (!result) {
      throw new Error("Download failed.");
    }
    console.log("Downloaded as " + result.uri);

    downloadedFiles++;
    setProgress(downloadedFiles / fileCount);

    return result.uri;
  };

  // Initialize the model
  await Pipeline.TextGeneration.init(preset.model, preset.onnx_path, {
    verbose: true,
    fetch: fetchWithCache,
    ...preset.options,
  });

  setProgress(1); // Ensure progress reaches 100% after completion
  onComplete();

  console.log("Loaded.");
};
