const pg = require('pg');
const uuid = require('uuid');
const bcrypt = require('bcrypt');

const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/the_acme_reservation_planner');

module.exports = {
  client
}; 

const createTables = async()=> {
    const SQL = `
        DROP TABLE IF EXISTS reservation;
        DROP TABLE IF EXISTS customer;
        DROP TABLE IF EXISTS restaurant;
        CREATE TABLE customer(
            id UUID PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL UNIQUE
        );
        CREATE TABLE restaurant(
            id UUID PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE
        );
        CREATE TABLE reservation(
            id UUID PRIMARY KEY,
            date DATE NOT NULL,
            party_count INTEGER NOT NULL,
            customer_id UUID REFERENCES customer(id) NOT NULL,
            restaurant_id UUID REFERENCES restaurant(id) NOT NULL
        );
    `;
    
    await client.query(SQL);
};

const createCustomer = async({name, password})=> {
    const SQL = `
      INSERT INTO customer(id, name, password) VALUES($1, $2, $3) RETURNING *
    `;
    const hashedPassword = await bcrypt.hash(password, 5)
    const response = await client.query(SQL, [uuid.v4(), name, hashedPassword]);

    return response.rows[0];
  };
  
  const createRestaurant = async(name)=> {
    const SQL = `
      INSERT INTO restaurant(id, name) VALUES($1, $2) RETURNING *
    `;
    const response = await client.query(SQL, [uuid.v4(), name]);
    return response.rows[0];
  }; 
  
  const fetchCustomers = async()=> {
      const SQL = `
    SELECT *
    FROM customer
      `;
      const response = await client.query(SQL);
      return response.rows;
    };
    
    const fetchRestaurants = async()=> {
      const SQL = `
    SELECT *
    FROM restaurant
      `;
      const response = await client.query(SQL);
      return response.rows;
    };   
  
    const createReservation = async({ restaurant_id, customer_id, date, party_count})=> {
      const SQL = `
        INSERT INTO reservation(id, restaurant_id, customer_id, date, party_count ) VALUES($1, $2, $3, $4, $5) RETURNING *
      `;
      const response = await client.query(SQL, [uuid.v4(), restaurant_id, customer_id, date, party_count]);
      return response.rows[0];
    };
    
    
    // const fetchVacations = async()=> {
    //   const SQL = `
    // SELECT *
    // FROM vacations
    //   `;
    //   const response = await client.query(SQL);
    //   return response.rows;
    // }; 
  
    const destroyReservation = async({ id, customer_id}) => {
      console.log(id, customer_id)
      const SQL = `
          DELETE FROM reservation
          WHERE id = $1 AND customer_id=$2
      `;
      await client.query(SQL, [id, customer_id]);
  }; 
  
  module.exports = {
      client,
      createTables,
      createCustomer,
      createRestaurant,
      fetchRestaurants,
      fetchCustomers,
      createReservation,
      destroyReservation
  };