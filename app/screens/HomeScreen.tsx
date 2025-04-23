import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Image,
  SafeAreaView,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Clipboard,
  ActivityIndicator,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import * as Progress from "react-native-progress";
import {
  loadModel,
  cancelDownload,
  resetDownloadState,
  isModelDownloaded,
} from "../utils/modelHandlers";
import { Ionicons } from "@expo/vector-icons";

import presets from "../../presets.json";
import user from "../../assets/confused-user.png";
import shield from "../../assets/shield.png";
import Button from "../components/Button";
import AutoComplete from "../views/AutoComplete";

const SCREEN_WIDTH = Dimensions.get("window").width;

const MODEL_FORMATS = [
  { label: "Full precision baseline", value: "model.onnx" },
  { label: "4-bit quant using BitsAndBytes", value: "model_bnb4.onnx" },
  { label: "Half precision", value: "model_fp16.onnx" },
  { label: "INT8 quantized", value: "model_int8.onnx" },
  { label: "4-bit quantized", value: "model_q4.onnx" },
  { label: "Mixed 4-bit with fp16", value: "model_q4f16.onnx" },
  { label: "Generic quantized", value: "model_quantized.onnx" },
  { label: "Unsigned INT8 quantized", value: "model_uint8.onnx" },
];

const HomeScreen = () => {
  const [downloadable, setDownloadable] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [input, setInput] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [open, setOpen] = useState(false);
  const [formatOpen, setFormatOpen] = useState(false);
  const [value, setValue] = useState<string | null>(null);
  const [formatValue, setFormatValue] = useState<string | null>(null);
  const [items, setItems] = useState([
    ...presets.map((preset) => ({ label: preset.name, value: preset.name })),
  ]);
  const [formatItems, setFormatItems] = useState(MODEL_FORMATS);
  const [downloadedFormats, setDownloadedFormats] = useState<string[]>([]);
  const [isCheckingFormats, setIsCheckingFormats] = useState(false);

  const checkDownloadedFormats = async (modelName: string) => {
    if (!modelName) return;

    // Show loader while checking
    setIsCheckingFormats(true);

    const downloaded: string[] = [];

    try {
      const checkPromises = MODEL_FORMATS.map(async (format) => {
        const isDownloaded = await isModelDownloaded(modelName, format.value);
        if (isDownloaded) {
          downloaded.push(format.value);
        }
      });

      await Promise.all(checkPromises);
      setDownloadedFormats(downloaded);

      setFormatItems(
        MODEL_FORMATS.map((format) => {
          const isDownloaded = downloaded.includes(format.value);
          return {
            ...format,
            label: isDownloaded ? `${format.label} ` : format.label,
            IconComponent: isDownloaded
              ? () => (
                  <Ionicons
                    name="cloud-done"
                    size={16}
                    color="#0078d4"
                    style={{ marginRight: 5 }}
                  />
                )
              : undefined,
            containerStyle: isDownloaded ? { backgroundColor: "#e6f7ff" } : {},
            labelStyle: isDownloaded
              ? { fontWeight: "bold", color: "#0078d4" }
              : {},
          };
        })
      );
    } catch (error) {
      console.error("Error checking formats:", error);
    } finally {
      // Hide loader when done
      setIsCheckingFormats(false);
    }
  };

  const handleValueChange = async (value: any) => {
    setValue(value);
    setFormatValue(null);
    setDownloadable(false);

    // Clear downloaded formats until check completes
    setDownloadedFormats([]);

    // Only check format availability after a model is selected
    if (value) {
      const preset = presets.find((preset) => preset.name === value);
      if (preset) {
        // This will set isCheckingFormats to true internally
        checkDownloadedFormats(preset.name);
      }
    }
  };

  const handleFormatChange = (formatValue: string | null) => {
    setFormatValue(formatValue);
  };

  const loadSelectedModel = async () => {
    if (
      !value ||
      !formatValue ||
      formatValue === null ||
      formatValue === undefined
    ) {
      setDownloadable(false);
      return;
    }

    const onComplete = () => {
      setProgress(1);
      setTimeout(() => {
        setDownloadable(false);
      }, 500);
    };

    const preset = presets.find((preset) => preset.name === value);
    if (!preset) return;

    setProgress(0);
    setDownloadable(true);
    const modelPath = `${preset.onnx_path}/${formatValue}`;
    loadModel(
      { ...preset, onnx_path: modelPath },
      setProgress,
      onComplete,
      setStatus
    );
  };

  useEffect(() => {
    // Remove automatic format checking on mount
    // Only set checking formats to false to ensure UI shows properly
    setIsCheckingFormats(false);
  }, []);

  useEffect(() => {
    loadSelectedModel();
  }, [value, formatValue]);

  useEffect(() => {
    // Only check formats if we're not currently downloading (progress is 0 or 1)
    // and value is defined, and we're not in a loading state
    if (value && (progress === 0 || progress === 1) && !downloadable) {
      const preset = presets.find((preset) => preset.name === value);
      if (preset) {
        checkDownloadedFormats(preset.name);
      }
    }
  }, [value, progress]);

  const handleInputChange = (text: string) => {
    setInput(text);
  };

  const handleButtonPress = () => {
    setShowModal(true);
  };

  const handlePaste = async () => {
    const text = await Clipboard.getString();
    setInput(text);
  };

  const handleClear = () => {
    setInput("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.topContent}>
          <View style={styles.logoWrapper}>
            <Image source={shield} style={styles.logo} />
            <Text style={styles.logoText}>FraudSheild</Text>
          </View>
          <View style={styles.subTitle}>
            <Text>Protecting users from financial fraud.</Text>
          </View>
          <View style={styles.imageWrapper}>
            <Image source={user} style={styles.image} />
          </View>
          <Text style={styles.description}>
            {`Received a suspicious message?\n\n Stay calm and verify it instantly with our financial fraud detection LLMs on your device!`}
          </Text>
        </View>
        <View style={styles.bottomContent}>
          <View style={styles.dropDownContainer}>
            <Text style={styles.inputTitle}>Fraud Detection LLM</Text>
            <View
              style={[styles.dropDownWrapper, { zIndex: formatOpen ? 1 : 2 }]}
            >
              <DropDownPicker
                open={open}
                value={value}
                items={items}
                setOpen={setOpen}
                setValue={setValue}
                onChangeValue={handleValueChange}
                setItems={setItems}
                style={styles.dropDown}
                placeholder="Select a Model"
                disabled={downloadable}
                zIndex={2}
              />
            </View>

            <Text style={[styles.inputTitle, { marginTop: 16 }]}>
              Model Variants
            </Text>
            <View
              style={[styles.dropDownWrapper, { zIndex: formatOpen ? 2 : 1 }]}
            >
              {!value ? (
                <View style={styles.selectModelFirstContainer}>
                  <Text style={styles.selectModelFirstText}>
                    Select a model first
                  </Text>
                </View>
              ) : isCheckingFormats ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="small" color="#0078d4" />
                  <Text style={styles.loaderText}>
                    Checking available formats...
                  </Text>
                </View>
              ) : (
                <DropDownPicker
                  open={formatOpen}
                  value={formatValue}
                  items={formatItems}
                  setOpen={setFormatOpen}
                  setValue={setFormatValue}
                  onChangeValue={handleFormatChange}
                  setItems={setFormatItems}
                  style={styles.dropDown}
                  dropDownContainerStyle={styles.dropDownContainer}
                  listItemLabelStyle={styles.dropdownItemLabel}
                  listItemContainerStyle={styles.dropdownItemContainer}
                  placeholder="Select Model Format"
                  placeholderStyle={styles.placeholderStyle}
                  showArrowIcon={true}
                  ArrowUpIconComponent={() => (
                    <Ionicons name="chevron-up" size={16} color="#666" />
                  )}
                  ArrowDownIconComponent={() => (
                    <Ionicons name="chevron-down" size={16} color="#666" />
                  )}
                  disabled={downloadable}
                  zIndex={1}
                />
              )}
            </View>

            <View style={styles.formatStatusContainer}>
              {value && downloadedFormats.length > 0 && !isCheckingFormats && (
                <View style={styles.formatStatusBadge}>
                  <Text style={styles.formatStatusText}>
                    {downloadedFormats.length} format
                    {downloadedFormats.length !== 1 ? "s" : ""} available
                    offline
                  </Text>
                </View>
              )}
            </View>

            {downloadable && (
              <View style={styles.progressBarContainer}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Progress.Bar
                    progress={progress}
                    width={SCREEN_WIDTH - 80}
                    height={8}
                  />
                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        console.log("User pressed cancel button");
                        await cancelDownload();
                      } catch (error) {
                        console.error("Error cancelling download:", error);
                        resetDownloadState();
                      } finally {
                        setDownloadable(false);
                        setProgress(0);
                        setStatus("Download cancelled");
                        setFormatValue(null);

                        // Refresh the format items list after cancelling
                        if (value) {
                          const preset = presets.find(
                            (preset) => preset.name === value
                          );
                          if (preset) {
                            checkDownloadedFormats(preset.name);
                          }
                        }
                      }
                    }}
                    style={{ marginLeft: 8 }}
                  >
                    <Ionicons name="stop-circle" size={28} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.progressBarText}>
                  {(progress * 100).toFixed(2)}%
                </Text>
                <Text style={styles.progressBarText}>{status}</Text>
              </View>
            )}
          </View>
          <View style={styles.inputContainer}>
            <View style={styles.inputTitleContainer}>
              <Text style={styles.inputTitle}>Suspicious Message</Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.pasteButton}
                  onPress={handlePaste}
                >
                  <Text style={styles.pasteButtonText}>Paste</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={handleClear}
                >
                  <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.messageInputWrapper}>
              <TextInput
                style={styles.messageInput}
                placeholder="Enter Message"
                multiline={true}
                onChangeText={handleInputChange}
                value={input}
              />
            </View>
          </View>
        </View>
        <View style={styles.buttonContainer}>
          <Button
            title="Verify Message"
            onPress={handleButtonPress}
            disabled={downloadable || !input}
          />
        </View>
      </ScrollView>
      {showModal && (
        <View style={styles.modalBackground}>
          <View style={styles.modalCard}>
            <AutoComplete
              closeModal={() => setShowModal(false)}
              input={input}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  input: {
    borderWidth: 1,
    borderColor: "black",
  },
  logoWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 32,
    height: 32,
  },
  logoText: {
    fontSize: 28,
    fontWeight: "bold",
    marginLeft: 8,
    color: "#004AAD",
  },
  subTitle: {
    marginTop: 8,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  imageWrapper: {
    marginTop: 16,
    width: "100%",
    alignItems: "center",
  },
  image: {
    width: 200,
    height: 200,
  },
  description: {
    marginTop: 16,
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
    textAlign: "center",
  },
  topContent: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  bottomContent: {
    width: "100%",
    padding: 16,
    zIndex: 2,
  },
  dropDownContainer: {
    width: "100%",
    justifyContent: "center",
    zIndex: 2,
    borderRadius: 0,
  },
  dropDownWrapper: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  inputTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  dropDown: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D1f1ff",
    borderWidth: 1,
    borderColor: "#8FAFDB",
    borderRadius: 0,
  },
  inputContainer: {
    marginTop: 32,
    width: "100%",
  },
  inputTitleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  messageInputWrapper: {
    width: "100%",
    position: "relative",
  },
  messageInput: {
    width: "100%",
    minHeight: 180,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    backgroundColor: "#D1f1ff",
  },
  pasteButton: {
    backgroundColor: "#004AAD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  pasteButtonText: {
    color: "white",
    fontWeight: "500",
  },
  clearButton: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  clearButtonText: {
    color: "white",
    fontWeight: "500",
  },
  buttonContainer: {
    width: "100%",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  progressBarContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  progressBarText: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 8,
  },
  modalBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    width: "100%",
    height: "100%",
    flex: 1,
    padding: 16,
  },
  modalCard: {
    width: "100%",
    minHeight: "50%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
  },
  dropdownItemLabel: {
    fontSize: 14,
  },
  dropdownItemContainer: {
    // Each item will define its own background color based on downloaded status
  },
  placeholderStyle: {
    color: "#666",
    fontStyle: "italic",
  },
  formatStatusContainer: {
    marginTop: 4,
    alignItems: "flex-end",
    marginBottom: 16,
  },
  formatStatusBadge: {
    backgroundColor: "#0078d4",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  formatStatusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  loaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D1f1ff",
    borderWidth: 1,
    borderColor: "#8FAFDB",
    borderRadius: 0,
    padding: 12,
    width: "100%",
    height: 50,
  },
  loaderText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#0078d4",
  },
  selectModelFirstContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    backgroundColor: "#f7f7f7",
    width: "100%",
  },
  selectModelFirstText: {
    fontSize: 14,
    color: "#666",
  },
});
