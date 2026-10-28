export interface CreateUserDto {
  email: string;
  password_hash: string;
  name: string;
  date_of_birth?: Date;
}
