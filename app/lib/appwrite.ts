import { Client, Databases, Account, Storage } from 'appwrite';



export const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('69134f93000138d6470c');

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);


