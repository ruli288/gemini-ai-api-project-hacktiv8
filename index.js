index.js
const express = require ('express');
const app = express ();
const port = 3000;
const dotenv.require(dotenv);

dotenv.config();

const app = express ();
cont port = [process.env.PORT|| 3000; 

	// Middlewares
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
	app.use(cors());
    app.use(express.static('public')) 
 constapp.use(express.static('public'));

// Gemini setup initiate AI model
const ai = new GoogleGenerativeAI(process.env.API_KEY);
const model = ai.getGenerativeModel({ model: 'models/gemini-1.5-flash' });

app.get('/',(req,res) => {
res.send('process.env.API_KEY ? 'API KEY is set: ${process.env.API_KEY}' : 'API KEY is not set');
});

app.listen(port, () => {
	console.log('Example app listening on port ${port} );
	});


//Route Penting !!
app.post('/chat', async (req, res) => {
    const userInput = req.body.message;
    try {
        const response = await model.generateContent({
            prompt: userInput,
            maxOutputTokens: 100,
        });
        res.json({ reply: response.candidates[0].content });
    } catch (error) {
        console.error('Error generating response: - index.js:42', error);
        res.status(500).json({ error: 'Failed to generate response' });
    }
}

//Route Penting !!!!
app.post('/chat', async (req, res) => {
    const userMessage = req.body.message;
    
    if (!userMessage) {
        return res.status(400).json({ error: 'Message is required' });
    }
    try {
        const result = await model.generateContent(userMessage);
        const response = await result.response({
        const text = response.text();

        res.json({ reply: text });
    } catch (error) {
        console.error('Error generating response: - index.js:61', error);
        res.status(500).json({ error: 'Failed to generate response' });
    }
      