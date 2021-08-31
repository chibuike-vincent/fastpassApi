exports.validatePassword = async () => {
    const pattern = /^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.*[A-Z])[a-zA-Z0-9!@#$%^&*]{8,100}$/;
    return pattern
}