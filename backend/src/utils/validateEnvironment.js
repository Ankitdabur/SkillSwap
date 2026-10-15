const requiredEnvironmentVariables = [
    "MONGODB_URL",
    "ACCESS_TOKEN_SECRET",
    "ACCESS_TOKEN_EXPIRY",
    "REFRESH_TOKEN_SECRET",
    "REFRESH_TOKEN_EXPIRY",
    "CORS_ORIGIN",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET"
]


const validateEnvironment = () => {

    const missingVariables =
        requiredEnvironmentVariables.filter(
            (variableName) =>
                !process.env[variableName]?.trim()
        )

    if (missingVariables.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missingVariables.join(", ")}`
        )
    }

    return

}


export { validateEnvironment }
