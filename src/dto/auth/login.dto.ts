export class LoginDto {
  constructor(public email: string, public password: string) {}

  public static create(data: any): [string?, LoginDto?] {
    const { email, password } = data;
    if (!email && !password) {
      return ["Email and password are required", undefined];
    }
    if (!email) {
      return ["Email is required", undefined];
    }

    if (!password) {
      return ["Password is required", undefined];
    }

    if (password.length < 8) {
      return ["Password must be at least 8 characters long", undefined];
    }

    return [undefined, new LoginDto(email, password)];
  }
}
