import React, { useEffect, useState } from "react";
import { View, Text, Dimensions, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import * as Progress from 'react-native-progress';
import { Pipeline } from "react-native-transformers";
import axios from "axios";

import warning from "../../assets/warning.png";
import check from "../../assets/checkmark.png";
import robot from "../../assets/robot.png";
import like from "../../assets/like.png";
import dislike from "../../assets/dislike.png";

import Button from "../components/Button";

const SCREEN_WIDTH = Dimensions.get('window').width;
const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby7FfuenyeCMsxByVeMeaJMH22CW6LLUvyz_ymAf3ePgGAqicfL2CbE7suNdj4g_tjzAg/exec"

const AutoComplete = ({ closeModal, input }: { closeModal: () => void, input: string }) => {
    const chatPrompt = `<|im_start|>system
    You are a helpful assistant that detects financial fraud. Respond with 'Yes' or 'No' only.<|im_end|>
    <|im_start|>user
    Is the following text fraudulent?
    
    Text: CONFIDENTIAL=2FCOOPERATIONIT IS MY GREAT PLEASURE IN WRITING YOU THIS LETTER ON BEHALF OF MYCOLLEAGUES AND MYSELF=2EYOUR PARTICULARS WERE GIVEN TO ME BY A MEMBER OF THE NIGERIAN EXPORTPROMOTION COUNCIL =28NEPC=29 WHO WAS AT THE FEDERAL GOVERNMENT DELEGATION TOYOUR COUNTRY DURING A TRADE EXHIBITION=2E I HAVE DECIDED TO SEEK ACONFIDENTIAL COOPERATION WITH YOU IN THE EXECUTION OF THE DEAL DESCRIBEDHERE FOR THE BENEFIT OF ALL PARTIES INVOLVED AND HOPE THAT YOU WILL KEEP ITAS TOP SECRET BECAUSE OF THE NATURE OF THE BUSINESS AND THE PERSONALITIESINVOLVED=2EWITHIN THE MINISTRY OF POWER AND STEEL WHERE I WORK AS A DIRECTOR PROJECTIMPLEMENTATION AND WITH THE COOPERATION OF FOUR OTHER TOP OFFICIALS=2C WE HAVEIN OUR POSSESSION AS OVERDUE PAYMENT BILLS TOTALLING $67=2C000 000=3A00m USD=28SIXTY SEVEN MILLION UNITED STATE DOLLARS=29 WHICH WE WANT TO TRANSFER ABROADWITH THE ASSISTANCE AND COOPERATION OF A TRUSTED FOREIGN FIRM OR INDIVIDUALWHO WILL RECEIVE THE SAID FUND ON OUR BEHALF INTO ANY ACCOUNT PROVIDED TORECEIVE SUCH FUNDS=2E WE ARE HANDICAPPED IN THIS DEAL BECAUSE THE CIVILSERVICE CODE OF CONDUCT DOES NOT ALLOW PUBLIC SERVANTS LIKE US TO OPERATEOFFOREA ACCOUNT=2C HENCE YOUR IMPORTANCE IN THE WHOLE TRANSACTION=2ETHE SAID AMOUNT WHICH WE HAVE GOTTEN APPROVAL TO REMIT BY TELEGRAPHICTRANSFER =28T=2ET=2E=29 TO FOREIGN BANK ACCOUNT YOU WILL PROVIDE BY FILING IN ANAPPLICATION THROUGH MY MINISTRY FOR THE TRANSFER OF RIGHT AND PRIVILEGES TOYOU=2ESINCE THE PRESENT NEW CIVILIAN GOVERNMENT OF MY COUNTRY IS DETERMINED TO PAYEVERY FOREIGN CONTRACTOR ALL DEBTS OWED SO AS TO MAINTAIN GOOD RELATIONSHIPWITH FOREIGN GOVERNMENT AND NON-GOVERNMENT FINANCIAL AGENCIES=2C WE HAVEDECIDED TO INCLUDE OUR BILL FOR APPROVALS WITH THE COOPERATION OF SOMEOFFICIALS FROM ALL THE GOVERNMENT MINISTRY WHICH WILL BE INVOLVED IN THEPAYMENT PROCESS=2E WE ARE SEEKING YOUR ASSISTANCE IN PROVIDING A VITAL ACCOUNTINTO WHICH WE CAN REMIT THIS MONEY BY ACTING AS OUR MAIN PARTNER AND TRUSTEEOR ACTING AS THE ORIGINAL CONTRACTOR=2E THIS WE CAN DO BY SWAPPING OF ACCOUNTAND CHANGING OF BENEFICIARY AND OTHER FORMS OF DOCUMENTATION UPONAPPLICATION FOR CLAIM TO REFLECT THE PAYMENT AND APPROVALS TO BE SECURED ONBEHALF OF YOU=2EI HAVE THE AUTHORITY OF MY PARTNERS INVOLVED TO PROPOSE THAT=2C SHOULD YOU BEWILLING TO ASSIST US IN THE TRANSACTION=2C YOUR SHARE OF THE SUM WILL BE 30%OF THE TOTAL SUM=2C 60% FOR US AND 10% FOR TAXATION AND MISCELLANEOUSEXPENSES=2ETHE BUSINESS IS 100% SAFE ON YOUR PART=2C BUT YOU HAVE TO KEEP ITCONFIDENTIAL=2E DO NOT INFORM YOUR BANKER YET UNLESS INSTRUCTED BY US=2E ALSO=2CYOUR AREA OF SPECIALIZATION IS NOT A HIDERANCE TO THE SUCCESSFUL EXECUTIONOF THIS TRANSACTION=2E I HAVE REPOSED MY CONFIDENCE IN YOU AND HOPE THAT YOUWILL NOT DISAPPOINT ME=2E PLEASE SEND REPLY TO ME TO INDICATE YOUR WILLINGNESSIN ASSISTING US SO THAT I WILL DIRECT YOU ON WHAT NEXT TO DO=2EINCLUDE YOURDIRECT TELEPHONE AND FAX NUMBERS IF YOU ARE RESPONDING=2ETHANKS FOR YOUR ANTICIPATED ASSISTANCE=2EYOURS SINCERELY=2CDONALD  ATTAH
    Fraud:<|im_end|>
    <|im_start|>assistant`;
    const [fetching, setFetching] = useState<boolean>(false);
    const [output, setOutput] = useState<string>();
    const [loading, setLoading] = useState<boolean>(false);
    const [showImprovement, setShowImprovement] = useState<boolean>(false);

    const handlePipelineComplete = (output: string) => {
        setLoading(false);
        setOutput(output);
    }

    const handleCloseModal = () => {
        closeModal();
    }

    const handleImprovement = async () => {
        try {
            setFetching(true);
            await axios.post(APP_SCRIPT_URL, {
                message: input,
                output: output,
                type: "APP_RESPONSE",
                isFraud: output === "Yes",
            });
            setFetching(false);
            console.log("Improvement sent");
        } catch (error) {
            console.log("Error: ", error);
            setFetching(false);
        }
    }

    const handleLike = async (like: boolean) => {
        try {
            setFetching(true);
            await axios.post(APP_SCRIPT_URL, {
                helpful: like,
                type: "USER_FEEDBACK",
            });
            setFetching(false);
        } catch (error) {
            setFetching(false);
        }

    }

    useEffect(() => {
        if (!input) return
        Pipeline.TextGeneration.generate(chatPrompt, handlePipelineComplete);
    }, [input])

    console.log("OUTPUT ==> ", output);

    return <View style={styles.container}>
        <View style={styles.closeButtonContainer}>
            <TouchableOpacity onPress={handleCloseModal}>
                <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
        </View>
        {!showImprovement ? <>
            {fetching && <ActivityIndicator size="large" color="#0000ff" />}
            {loading && <View style={styles.progressBarContainer}>
                <Progress.Bar progress={0.4} width={SCREEN_WIDTH - 128} height={8} indeterminate={true} />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>}
            {!!output && !loading && <View style={styles.outputContainer}>
                <Image source={warning} style={styles.warningImage} />
                <Text style={styles.warningText}>FRAUD DETECTED</Text>
                <Text style={styles.outputText}>This message appears to be fraudulent. Do not respond or share personal details!</Text>
                <View style={styles.feedbackContainer}>
                    <Text>How did we do?</Text>
                    <TouchableOpacity style={styles.feedbackButton} onPress={() => handleLike(true)}>
                        <Image source={like} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.feedbackButton} onPress={() => handleLike(false)}>
                        <Image source={dislike} />
                    </TouchableOpacity>
                </View>
            </View>}
            {!loading && !output && <View style={styles.outputContainer}>
                {fetching && <ActivityIndicator size="large" color="#0000ff" />}
                <Image source={check} style={styles.warningImage} />
                <Text style={styles.safeText}>SAFE MESSAGE</Text>
                <Text style={styles.outputText}>This message appears to be fraudulent. Do not respond or share personal details!</Text>
                <View style={styles.feedbackContainer}>
                    <Text>How did we do?</Text>
                    <TouchableOpacity style={styles.feedbackButton} onPress={() => handleLike(true)}>
                        <Image source={like} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.feedbackButton} onPress={() => handleLike(false)}>
                        <Image source={dislike} />
                    </TouchableOpacity>
                </View>
            </View>}
            <View style={styles.buttonContainer}>
                <Button title="Okay" onPress={() => setShowImprovement(true)} buttonStyle={styles.neutralButton} />
            </View>
        </> : <View style={styles.outputContainer}>
            {fetching && <ActivityIndicator size="small" color="#0000ff" />}
            <Image source={robot} style={styles.warningImage} />
            <Text style={styles.titleText}>Help Improve FraudSheild</Text>
            <Text style={styles.outputText}>Would you like to allow us to use this message to improve our fraud detection system? Your data will be anonymized and used only for training purposes.</Text>
            <View style={styles.buttonContainer}>
                <Button title="No, skip" onPress={closeModal} buttonStyle={styles.negativeButton} />
                <Button title="Yes, use it!" onPress={handleImprovement} buttonStyle={styles.positiveButton} />
            </View>
        </View>}
    </View>;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "flex-start",
        alignItems: "center",
        padding: 16,
    },
    progressBarContainer: {
        marginTop: 32,
        width: "100%",
        alignItems: "center",
    },
    closeButtonContainer: {
        width: "100%",
        alignItems: "flex-end",
    },
    closeButtonText: {
        fontSize: 16,
        fontWeight: "bold",
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: "bold",
    },
    outputContainer: {
        marginTop: 8,
        width: "100%",
        alignItems: "center",
    },
    outputText: {
        fontSize: 16,
        fontWeight: "400",
        marginBottom: 16,
        marginTop: 8,
        textAlign: "center",
    },
    warningImage: {
        width: 80,
        height: 80,
        marginBottom: 8,
    },
    feedbackContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        gap: 8,
    },
    feedbackButton: {
        padding: 4,
    },
    warningText: {
        fontSize: 20,
        fontWeight: "bold",
        textTransform: "uppercase",
        color: "#CD2F2E",
    },
    safeText: {
        fontSize: 20,
        fontWeight: "bold",
        textTransform: "uppercase",
        color: "#039855",
    },
    buttonContainer: {
        marginTop: 16,
        width: "100%",
        flexDirection: "row",
        justifyContent: "center",
        gap: 8,
    },
    titleText: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#004AAD",
    },
    negativeButton: {
        backgroundColor: "#CD2F2E",
        width: 150,
    },
    positiveButton: {
        backgroundColor: "#039855",
        width: 150,
    },
    neutralButton: {
        width: "100%",
    },
});

export default AutoComplete;