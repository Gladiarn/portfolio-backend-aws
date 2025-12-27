exports.handler = async () => {
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "API is working",
            timestamp: new Date().toISOString()
        })
    };
};