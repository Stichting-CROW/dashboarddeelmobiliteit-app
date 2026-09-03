const fusionauth_url: string = `${process.env.REACT_APP_FUSIONAUTH_URL}`;
const fusionauth_application_id: string =
  `${process.env.REACT_APP_FUSIONAUTH_APPLICATION_ID}`;

/**
 * Starts the FusionAuth forgot-password workflow and emails the Forgot
 * Password template. Used only by "Wachtwoord vergeten?" on the login page.
 * New users get FusionAuth's Setup Password email from the admin API instead.
 */
export const sendForgotPasswordEmail = async (loginId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${fusionauth_url}/api/user/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId })
    });
    return response.ok;
  } catch (err) {
    console.error('Could not start forgot-password workflow', err);
    return false;
  }
};

/**
 * Sets a new password using a changePasswordId from a Setup Password or
 * Forgot Password email. On success FusionAuth returns a oneTimePassword that
 * can be used to log the user in immediately.
 */
export const changePassword = async (
  changePasswordId: string,
  password: string
): Promise<{ oneTimePassword?: string } | null> => {
  try {
    const response = await fetch(
      `${fusionauth_url}/api/user/change-password/${changePasswordId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      }
    );
    if (!response.ok) {
      return null;
    }
    // FusionAuth may return an empty body on older versions; treat that as
    // success without an auto-login token.
    const text = await response.text();
    if (!text) {
      return {};
    }
    return JSON.parse(text);
  } catch (err) {
    console.error('Could not change password', err);
    return null;
  }
};

/**
 * Logs in with the oneTimePassword returned by changePassword, matching the
 * shape Login.jsx stores via setUser (token, user, etc.).
 */
export const loginWithOneTimePassword = async (
  oneTimePassword: string
): Promise<any | null> => {
  try {
    const response = await fetch(`${fusionauth_url}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        oneTimePassword,
        applicationId: fusionauth_application_id
      })
    });
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (err) {
    console.error('Could not log in with one-time password', err);
    return null;
  }
};
