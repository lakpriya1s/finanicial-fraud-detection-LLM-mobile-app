import React, { useState } from "react";
import { View, TextInput, Text, StyleSheet, Image, SafeAreaView, Dimensions, ScrollView } from "react-native";
import DropDownPicker from 'react-native-dropdown-picker';
import * as Progress from 'react-native-progress';
import { checkIfModelExists, loadModel } from "../utils/modelHandlers";

import presets from "../../presets.json";
import user from "../../assets/confused-user.png";
import shield from "../../assets/shield.png";
import Button from "../components/Button";
import AutoComplete from "../views/AutoComplete";

const SCREEN_WIDTH = Dimensions.get('window').width;


const HomeScreen = () => {
    const [downloadable, setDownloadable] = useState(false);
    const [progress, setProgress] = useState(0);
    const [input, setInput] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(null);
    const [items, setItems] = useState([...presets.map(preset => ({ label: preset.name, value: preset.name }))]);

    const handleValueChange = async (value: any) => {
        const onComplete = () => {
            setProgress(1)
            setTimeout(() => {
                setDownloadable(false);
            }, 500);
        }

        setValue(value);
        const preset = presets.find(preset => preset.name === value);
        if (!preset) return;

        setProgress(0);
        setDownloadable(true);
        loadModel(preset, setProgress, onComplete);
    }

    const handleInputChange = (text: string) => {
        setInput(text);
    }

    const handleButtonPress = () => {
        setShowModal(true)
    }


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
                    <Text style={styles.description}>Received a suspicious message? Stay calm and verify it instantly!</Text>
                </View>
                <View style={styles.bottomContent}>
                    <View style={styles.dropDownContainer}>
                        <Text style={styles.inputTitle}>Select Fraud Detection Model</Text>
                        <View style={styles.dropDownWrapper}>
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
                            />
                        </View>
                        {downloadable && <View style={styles.progressBarContainer}>
                            <Progress.Bar progress={progress} width={SCREEN_WIDTH - 32} height={8} />
                            <Text style={styles.progressBarText}>{progress.toFixed(2)}%</Text>
                            <Text style={styles.progressBarText}>{downloadable ? "Loading Model..." : "Model Loaded"}</Text>
                        </View>}
                    </View>
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputTitle}>Paste or Type Suspicious Message Here</Text>
                        <View style={styles.messageInputWrapper}>
                            <TextInput style={styles.messageInput} placeholder="Enter Message" multiline={true} onChangeText={handleInputChange} />
                        </View>
                    </View>
                </View>
                <View style={styles.buttonContainer}>
                    <Button title="Verify Message" onPress={handleButtonPress} disabled={downloadable || !input} />
                </View>
            </ScrollView>
            {showModal && <View style={styles.modalBackground}>
                <View style={styles.modalCard}>
                    <AutoComplete closeModal={() => setShowModal(false)} input={input} />
                </View>
            </View>}
        </SafeAreaView>
    );
};

export default HomeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
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
        color: "#004AAD"
    },
    subTitle: {
        marginTop: 8,
        fontSize: 16,
        color: "#666",
        fontWeight: "500"
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
    },
    dropDownContainer: {
        width: "100%",
        justifyContent: "center",
        zIndex: 1000,
    },
    dropDownWrapper: {
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
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
    messageInputWrapper: {
        width: '100%',
    },
    messageInput: {
        width: '100%',
        minHeight: 180,
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        backgroundColor: "#D1f1ff"
    },
    buttonContainer: {
        width: '100%',
        alignItems: 'flex-end',
        justifyContent: 'center',
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
    }
});
