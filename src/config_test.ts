const requiredEnvVars = [
	"DUMMY_JWT_PAYLOAD",
	"WRONG_JWT_PAYLOAD",
	"DUMMY_ID",
	"DUMMY_ID_2",
];

const missingEnvVars: string[] = [];

requiredEnvVars.forEach((variable) => {
	if (!process.env[variable]) {
		missingEnvVars.push(variable);
	}
});

if (missingEnvVars.length > 0) {
	console.error("Missing environment variables:", missingEnvVars);
	process.exit(1);
}

const envVars = {
	DUMMY_JWT_PAYLOAD: process.env.DUMMY_JWT_PAYLOAD || "",
	WRONG_JWT_PAYLOAD: process.env.WRONG_JWT_PAYLOAD || "",
	DUMMY_ID: process.env.DUMMY_ID || "",
	DUMMY_ID_2: process.env.DUMMY_ID_2 || "",
};

export default envVars;
