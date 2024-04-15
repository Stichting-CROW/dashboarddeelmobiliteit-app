export const getFetchOptions = (token?) => {
    if(token) {
      return {
        headers: {
          // "authorization": `Bearer ${token}`,
          "authorization": `Bearer ${process.env.REACT_APP_MDS_TEST_TOKEN}`,
          "Content-Type": "application/json",
          "charset": "utf-8"
        }
      }
    }
    return {
      headers: {
        "Content-Type": "application/json",
        "charset": "utf-8"
      }
    }
}
