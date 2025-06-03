export class GoogleLoginDto {
  constructor(
    public email: string,
    public displayName: string,
    public photoURL: string | null,
    public uid: string,
    public idToken: string
  ) {}

  public static create(data: any): [string?, GoogleLoginDto?] {
    const { email, displayName, photoURL, uid, idToken } = data;

    if (!email || !displayName || !uid || !idToken) {
      return ["Missing required fields", undefined];
    }

    return [undefined, new GoogleLoginDto(email, displayName, photoURL, uid, idToken)];
  }
} 