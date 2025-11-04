
export class createUserDto {
  email: string
  username: string
  fullname: string
  roleId: string
  phonenumber: string
}

export class CreateUserPayload {
  userToken: userTokenDto
  userInfo: createUserDto; // assuming you already have this DTO
}

export class userTokenDto {
  id: string;
  username: string;
  role: string;
  iat: string;
  exp: string
}

export class deleteUserDto {
  userToken: userTokenDto
  userId: string
}