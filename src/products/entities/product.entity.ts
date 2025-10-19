import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Product {

    @PrimaryGeneratedColumn('uuid')
        id: string;

    @Column('text',{
        unique: true
        })
        title: string;

    @Column('int' ,{
        default: 0,
        })
        stock: number;

    @Column('numeric', {
        default: 0
        })
        price: number;

    @Column('numeric', {
        default: 0
        })
        price2: number;

    @Column('numeric', {
        default: 0
        })
        price3: number;

    @Column('numeric', {
        default: 0
        })
        price4: number;
    
    
        @BeforeInsert()
        checkSlugInsert() {
            
        }
}