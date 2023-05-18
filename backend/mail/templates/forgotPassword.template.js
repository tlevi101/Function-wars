const forgotPassword = (user, link) => {
    return `
		<h1>Dear ${user.name}</h1>
		<p>
			As you requested your reset password link has been 
			created. Please click on the button below 
			(or directly to the link)
		</p>
		<br>
		<a href="${link}">
			<button>
				Reset password
			</button>
		</a>
		<br>
		<a href="${link}">
			${link}
		</a>
	`;
};

module.exports = forgotPassword;
