export class RegisterDto {
  constructor(
    public email: string,
    public username: string,
    public password: string,
    public confirmPassword: string
  ) {}

  public static create(data: any): [string?, RegisterDto?] {
    const { email, username, password, confirmPassword } = data;
    if (!email && !username && !password && !confirmPassword) {
      return [
        "Email, username, password and confirmPassword are required",
        undefined,
      ];
    }
    if (!email) {
      return ["Email is required", undefined];
    }

    if (!password) {
      return ["Password is required", undefined];
    }
    if (!confirmPassword) {
      return ["Confirm password is required", undefined];
    }

    if (password !== confirmPassword) {
      return ["Passwords do not match", undefined];
    }

    if (password.length < 8) {
      return ["Password must be at least 8 characters long", undefined];
    }

    if (!username) {
      return ["Username is required", undefined];
    }

    if (!confirmPassword) {
      return ["Confirm password is required", undefined];
    }

    return [
      undefined,
      new RegisterDto(email, username, password, confirmPassword),
    ];
  }
}
