import { Test, TestingModule } from "@nestjs/testing"
import { UsersController } from "./users.controller"
import { UsersService } from "./users.service"

const fakeUserToken = {
    "id": "1",
    "username": "john",
    "role": "Admin",
    "isVerified": true,
    "iat": "1759494506",
    "exp": "1759498106"
}

const mockService = {
    createNewUser: jest.fn(),
    findUserById: jest.fn(),
    updateProfile: jest.fn(),
    deleteUser: jest.fn()
}

const mockUser = {
    email: 'user@gmail.com',
    username: 'doe',
    fullname: "John doe",
    roleId: "2",
    phonenumber: "0712340595"
}
const profileInfo = {
    userDetails: fakeUserToken,
    profileDetails: {
        email: 'user1@gmail.com',
        username: 'doe2',
        fullname: "John doe2",
        roleId: "1",
        phonenumber: "0712340595"
    }
}
const updatedUser = {
    email: 'user1@gmail.com',
    username: 'doe2',
    fullname: "John doe2",
    roleId: "1",
    phonenumber: "0712340595"
}

describe('usersController', () => {
    let controller: UsersController
    let service: UsersService

    beforeEach(async () => {
        const Module: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [{
                provide: UsersService,
                useValue: mockService
            }]
        }).compile()

        controller = Module.get<UsersController>(UsersController)
        service = Module.get<UsersService>(UsersService)
    })

    it('should return created user', async () => {
        (service.createNewUser as jest.Mock).mockResolvedValue(mockUser)
        const result = await controller.createNewUser({userToken:fakeUserToken,userInfo:mockUser})
        expect(result).toBeInstanceOf(Object)
    })

    it('should find user by id',async()=>{
        (service.findUserById as jest.Mock).mockResolvedValue(mockUser)
        const result = await controller.findUserById('1')
        expect(result).toEqual(mockUser)
        expect(result?.email).toBe(mockUser.email)
        expect(result).toHaveProperty('roleId')
    })

    it('should update user profile',async()=>{
        (service.updateProfile as jest.Mock).mockResolvedValue({id:'1',...updatedUser})
        const result = await controller.updateProfile(profileInfo)
        expect(result).toEqual({id:'1',...updatedUser})
        //expect(service.updateProfile).toHaveBeenCalledWith({profileDetails:updatedUser},'1')
    })

    it('should delete updated user',async()=>{
        (service.deleteUser as jest.Mock).mockResolvedValue({affected:1})
        const result = await controller.deleteUser({userToken:fakeUserToken,userId:'1'})
        expect(result).toBeTruthy()
        expect(result).toEqual({affected:1})
    })

})