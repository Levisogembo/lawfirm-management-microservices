
export class userTokenDto {
    id: string;
    username: string;
    role: string;
    iat: string;
    exp: string
  }

export class createRoleDto{
    userToken: userTokenDto
    role: string
}

