import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Cases } from "./Cases";
import { Clients } from "./Clients";

@Entity({name:'files'})
export class Files {
    @PrimaryGeneratedColumn('uuid')
    fileId: string

    @Column({unique:true})
    fileName: string

    @Column()
    uploadedAt: Date

    @Column()
    uploadedBy: string

    @Column()
    fileType: string

    @Column()
    mimeType: string

    @Column()
    fileSize: string

    @Column({nullable:true})
    filepath?: string

    @Column({nullable:true})
    s3FileUrl?: string //this url is the key of object/file in the s3 bucket
    
    @Column({nullable:true})
    s3Key?: string // a unique key to be used by clients for downloads, deletes or updates
    //relating file to the case
    @ManyToOne(()=>Cases,(cases)=>cases.files)
    @JoinColumn({name:'caseId'})
    Case?: Cases

    //relating files to clients
    @ManyToOne(()=>Clients,(client)=>client.files)
    @JoinColumn({name:'clientId'})
    Client?: Clients

} 