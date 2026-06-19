// Minimal typings for the Google Identity Services + Sign in with Apple JS SDKs.
interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleIdConfig {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
}

interface GoogleButtonOptions {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "small" | "medium" | "large";
  text?: "signin_with" | "signup_with" | "continue_with";
  width?: number;
}

interface AppleSignInResponse {
  authorization: { id_token: string; code: string };
  user?: { email?: string; name?: { firstName?: string; lastName?: string } };
}

interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: GoogleIdConfig) => void;
        renderButton: (
          parent: HTMLElement,
          options: GoogleButtonOptions,
        ) => void;
        cancel: () => void;
      };
    };
  };
  AppleID?: {
    auth: {
      init: (config: {
        clientId: string;
        scope: string;
        redirectURI: string;
        usePopup: boolean;
      }) => void;
      signIn: () => Promise<AppleSignInResponse>;
    };
  };
}
