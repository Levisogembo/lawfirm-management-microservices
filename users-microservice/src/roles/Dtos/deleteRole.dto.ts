
export class userTokenDto {
    id: string;
    username: string;
    role: string;
    iat: string;
    exp: string
  }

export class deleteRoleDto{
    userToken: userTokenDto
    id: string
}