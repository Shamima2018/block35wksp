const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
app.use(express.json());


const {
    client,
    createTables,
    createCustomer,
    createRestaurant,
    fetchRestaurants,
    fetchCustomers,
    createReservation,
    destroyReservation
} = require('./db');

app.get('/api/customer', async(req, res, next)=> {
    try {
      res.send(await fetchCustomers());
    }
    catch(ex){
      next(ex);
    }
  });


  app.post('/api/customer', async (req, res) => {
    const { id, name, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await client.query("INSERT INTO Customer (id,name,password) VALUES ($1, $2, $3)", [id, name, hashedPassword]);
    res.json('Customer created');
})

app.post('/api/login', async (req, res) => {
    const { name, password } = req.body;
    const user = await client.query("SELECT * from Customer WHERE name = $1", [name]);
    const isPassowrdMatching = await bcrypt.compare(password, user.rows[0].password);
    if (isPassowrdMatching) {
        res.json('Login successful');
    } else {
        res.json('Login failed');
    }
})
  
  app.get('/api/restaurant', async(req, res, next)=> {
    try {
      res.send(await fetchRestaurants());
    }
    catch(ex){
      next(ex);
    }
  });
  
  
  app.delete('/api/customer/:customer_id/reservation/:id',  async(req, res, next)=> {
    try {
        await destroyReservation({customer_id: req.params.customer_id, id: req.params.id});
        res.sendStatus(204);
    }
    catch(ex){
        next(ex);
    }
});



const init = async()=> {
    console.log('connecting to database');
    await client.connect();
    console.log('connected to database');
    await createTables();
    console.log('created tables');
    const [moe, lucy, larry, ethyl, paris, london, nyc] = await Promise.all([
        createCustomer({ name: 'moe', password: 'wertttd'}),
        createCustomer({ name: 'lucy', password: 'werrrtttttd'}),
        createCustomer({ name: 'larry', password: 'wscvfr'}),
        createCustomer({ name: 'ethyl', password: 'asder'}),
        createRestaurant({ name: 'paris'}),
        createRestaurant({ name: 'london'}),
        createRestaurant({ name: 'nyc'}),
    ]);
    console.log(await fetchCustomers());
    console.log(await fetchRestaurants());

    const [reservation, reservation2] = await Promise.all([
        createReservation({
        customer_id: moe.id,
        restaurant_id: nyc.id,
        date: '02/14/2024',
        party_count: 4
        }),
        createReservation({
            customer_id: moe.id,
            restaurant_id: nyc.id,
            date: '02/28/2024',
            party_count: 3
        }),
    ]);
    //console.log(await fetchVacations());
    await destroyReservation({ id: reservation.id, customer_id: reservation.user_id});
    //console.log(await fetchVacations());

    const port = process.env.PORT || 3000;
    app.listen(port, ()=> {
        console.log(`listening on port ${port}`);
        console.log('some curl commands to test');
        console.log(`curl localhost:${port}/api/customer`);
        console.log(`curl localhost:${port}/api/restaurant`);
       console.log(`curl localhost:${port}/api/reservation`);
       console.log(`curl -X DELETE localhost:${port}/api/customer/${moe.id}/restaurant/${reservation2.id}`);
     });

};

init();

