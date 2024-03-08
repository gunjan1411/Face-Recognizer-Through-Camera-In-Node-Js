const express = require("express");
const mongoose = require('mongoose')
const path = require("path");
const bodyParser = require('body-parser');
const cors = require("cors");




/* const scriptFunctions = require('../script'); */// Option 1: Using Functions
/* require("/face-square-detection/script"); */

const app = express();

app.use(cors());

mongoose.connect("mongodb://127.0.0.1:27017/Face-detection-project",{

}).then(() => {
    console.log("connection is successful with DB");
}).catch((err) => {
    console.log(err);
});

const user_data_info = new mongoose.Schema({
    name: {
        type: String
    }
}
)
/* creating new Collection */
const user_name = new mongoose.model("user_name", user_data_info);

app.use(express.json());
app.use(express.urlencoded({ extended: false }))

const script_path = path.join(__dirname, "../script");



app.get("/try", (req, res) => {
    console.log('HI FROM SERVER');
    console.log(__dirname);
    res.send("hiiii");

})


app.post("/saveDetectedNames", async (req, res)=>{
    try {
        const { names } = req.body;
        console.log('Names received from client:', names);

        // Save each detected name to the database
        await Promise.all(names.map(async (name) => {
            const existingUser = await user_name.findOne({ name });
            if (!existingUser) {
                await user_name.create({ name });
            }
        }));
        
        res.json({ success: true, message: 'Detected names saved successfully' });
    } catch (error) {
        console.error('Error saving detected names:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.listen(3001, () => {
    console.log("Server Is Running");
});