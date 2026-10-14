const authHeader = (accessToken) => {

    return {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    }

}


export { authHeader }
