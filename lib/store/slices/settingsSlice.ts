import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SettingsState {
  mpesa: {
    consumerKey: string;
    consumerSecret: string;
    shortcode: string;
    passkey: string;
  };
  sms: {
    apiKey: string;
    username: string;
    senderId: string;
  };
  email: {
    smtpHost: string;
    smtpPort: string;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
  };
  cognito: {
    userPoolId: string;
    clientId: string;
    region: string;
    clientSecret: string;
  };
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
  initialized: boolean;
}

const initialState: SettingsState = {
  mpesa: {
    consumerKey: "",
    consumerSecret: "",
    shortcode: "",
    passkey: "",
  },
  sms: {
    apiKey: "",
    username: "",
    senderId: "",
  },
  email: {
    smtpHost: "",
    smtpPort: "",
    smtpUser: "",
    smtpPassword: "",
    fromEmail: "",
    fromName: "",
  },
  cognito: {
    userPoolId: "",
    clientId: "",
    region: "",
    clientSecret: "",
  },
  cloudinary: {
    cloudName: "",
    apiKey: "",
    apiSecret: "",
  },
  initialized: false,
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setMpesaSettings: (state, action: PayloadAction<SettingsState["mpesa"]>) => {
      state.mpesa = action.payload;
    },
    setSmsSettings: (state, action: PayloadAction<SettingsState["sms"]>) => {
      state.sms = action.payload;
    },
    setEmailSettings: (state, action: PayloadAction<SettingsState["email"]>) => {
      state.email = action.payload;
    },
    setCognitoSettings: (state, action: PayloadAction<SettingsState["cognito"]>) => {
      state.cognito = action.payload;
    },
    setCloudinarySettings: (state, action: PayloadAction<SettingsState["cloudinary"]>) => {
      state.cloudinary = action.payload;
    },
    initializeSettings: (state, action: PayloadAction<Partial<SettingsState>>) => {
      return { ...state, ...action.payload, initialized: true };
    },
    resetSettings: () => initialState,
  },
});

export const {
  setMpesaSettings,
  setSmsSettings,
  setEmailSettings,
  setCognitoSettings,
  setCloudinarySettings,
  initializeSettings,
  resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;

