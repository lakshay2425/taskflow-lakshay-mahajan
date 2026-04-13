export const verifyLogin = async (inputValidation, dependencies) => {
    const { db, bcrypt, jwt, uuidv4, secret, saltRounds } = dependencies;
    const email = inputValidation.email.toLowerCase();

    const userData = await db('users').where({ email }).first();

    const userPassword = userData?.password || await bcrypt.hash(uuidv4(), saltRounds);

    const verify = await bcrypt.compare(inputValidation.password, userPassword);

    if (!verify || !userData) {
        return {
            status: 401,
            success: false,
            message: "Invalid credentials, Please check your email and password and try again"
        };
    }

    const tokenResponse = await createJwtToken(userData, { secret, jwt });

    return {
        success: tokenResponse.success,
        status: tokenResponse.success ? 200 : 500,
        token: tokenResponse.token,
        message: tokenResponse.message || "Token generation failed",
    };
};

export const signupUser = async (inputValidation, dependencies) => {
    const { db, bcrypt, jwt, secret, saltRounds } = dependencies;
    const email = inputValidation.email;

    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
        return {
            success: false,
            status: 409,
            message: "An account with this email already exists",
        };
    }

    const hashedPassword = await bcrypt.hash(inputValidation.password, saltRounds);

    const [newUser] = await db('users')
        .insert({
            name: inputValidation.name,
            email: email,
            password: hashedPassword,
        })
        .returning(['id', 'email']);

    const tokenResponse = await createJwtToken(newUser, { secret, jwt });

    return {
        success: true,
        token: tokenResponse.token,
        message: tokenResponse.message || "Token generation failed",
    };
};

const createJwtToken = async (user, dependencies) => {
    const { secret, jwt } = dependencies;

    const payload = {
        user_id: user.id,
        email: user.email
    };

    try {
        const token = jwt.sign(payload, secret, {
            algorithm: 'HS256',
            expiresIn: '24h'
        });
        return { success: true, token };
    } catch (error) {
        return { success: false, message: "Token generation failed" };
    }
};
