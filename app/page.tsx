'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Mic, StopCircle } from 'lucide-react'

const analyzeSentiment = (text) => {
  const positiveWords = ['good', 'great', 'excellent', 'profit', 'gain', 'up', 'bullish', 'confident']
  const negativeWords = ['bad', 'poor', 'loss', 'down', 'bearish', 'worried', 'concerned']
  
  const words = text.toLowerCase().split(/\W+/)
  let score = 0
  
  words.forEach(word => {
    if (positiveWords.includes(word)) score++
    if (negativeWords.includes(word)) score--
  })
  
  if (score > 0) return 'Positive'
  if (score < 0) return 'Negative'
  return 'Neutral'
}

export default function TradingJournal() {
  const [activeTab, setActiveTab] = useState('journal')
  const [journalEntries, setJournalEntries] = useState([])
  const [currentEntry, setCurrentEntry] = useState({
    date: '',
    symbol: '',
    action: '',
    price: '',
    quantity: '',
    notes: '',
  })
  const [aiInsights, setAiInsights] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [voiceInput, setVoiceInput] = useState('')
  const recognitionRef = useRef(null)
  const transcriptRef = useRef('')

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const recognitionInstance = new (window as any).webkitSpeechRecognition()
      recognitionInstance.continuous = true
      recognitionInstance.interimResults = true

      recognitionInstance.onresult = (event) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          } else {
            interimTranscript += event.results[i][0].transcript
          }
        }

        transcriptRef.current = finalTranscript || interimTranscript
      }

      recognitionRef.current = recognitionInstance
    }
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setCurrentEntry(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newEntry = { ...currentEntry, voiceInput, id: Date.now() }
    setJournalEntries(prev => [newEntry, ...prev])
    generateInsights(newEntry)
    setCurrentEntry({
      date: '',
      symbol: '',
      action: '',
      price: '',
      quantity: '',
      notes: '',
    })
    setVoiceInput('')
  }

  const generateInsights = (entry) => {
    const combinedText = `${entry.notes} ${entry.voiceInput}`
    const sentiment = analyzeSentiment(combinedText)
    const words = combinedText.toLowerCase().split(/\W+/).filter(word => word.length > 3)
    const keyWords = [...new Set(words)].slice(0, 5).join(', ')
    
    let insightText = `Sentiment Analysis: ${sentiment}\n`
    insightText += `Key words: ${keyWords}\n`
    insightText += `Action taken: ${entry.action} ${entry.quantity} shares of ${entry.symbol} at $${entry.price}\n`
    insightText += `Potential next steps: ${
      sentiment === 'Positive' ? 'Consider taking profits' : 
      sentiment === 'Negative' ? 'Monitor closely for exit opportunities' : 
      'Continue to observe market conditions'
    }`

    if (entry.voiceInput) {
      insightText += `\n\nVoice Input Analysis:\n`
      insightText += `The trader's voice input suggests ${sentiment.toLowerCase()} sentiment. `
      insightText += `Key points mentioned: ${keyWords}. `
      insightText += `This aligns with the ${entry.action} action taken on ${entry.symbol}.`
    }

    setAiInsights(insightText)
  }

  const calculatePerformance = () => {
    const performanceData = journalEntries.reduce((acc, entry) => {
      const symbol = entry.symbol
      if (!acc[symbol]) {
        acc[symbol] = { buys: 0, sells: 0, quantity: 0, totalCost: 0 }
      }
      const quantity = parseInt(entry.quantity)
      const price = parseFloat(entry.price)
      if (entry.action === 'buy') {
        acc[symbol].buys += quantity
        acc[symbol].quantity += quantity
        acc[symbol].totalCost += quantity * price
      } else if (entry.action === 'sell') {
        acc[symbol].sells += quantity
        acc[symbol].quantity -= quantity
        acc[symbol].totalCost -= quantity * price
      }
      return acc
    }, {})

    return Object.entries(performanceData).map(([symbol, data]) => ({
      symbol,
      quantity: data.quantity,
      averageCost: data.totalCost / (data.buys - data.sells),
    }))
  }

  const startRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start()
      setIsRecording(true)
      transcriptRef.current = ''
    } else {
      console.error('Speech recognition is not supported in this browser.')
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsRecording(false)
      setVoiceInput(transcriptRef.current)
    }
  }

return (
  <div className="container mx-auto p-4">
    <h1 className="text-3xl font-bold mb-6 text-[#FF6D6D]">Trading Journal</h1>
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-4 bg-[#FFD3D3] text-[#FF6D6D]">
        <TabsTrigger value="journal" className="hover:bg-[#FFB3B3] text-[#FF6D6D]">Journal Entry</TabsTrigger>
        <TabsTrigger value="insights" className="hover:bg-[#FFB3B3] text-[#FF6D6D]">AI Insights</TabsTrigger>
        <TabsTrigger value="performance" className="hover:bg-[#FFB3B3] text-[#FF6D6D]">Performance</TabsTrigger>
        <TabsTrigger value="history" className="hover:bg-[#FFB3B3] text-[#FF6D6D]">History</TabsTrigger>
      </TabsList>
      <TabsContent value="journal">
        <Card>
          <CardHeader>
            <CardTitle>New Journal Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" name="date" type="date" value={currentEntry.date} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="symbol">Stock Symbol</Label>
                  <Input id="symbol" name="symbol" value={currentEntry.symbol} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="action">Action</Label>
                  <Select name="action" value={currentEntry.action} onValueChange={(value) => handleInputChange({ target: { name: 'action', value } })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input id="price" name="price" type="number" step="0.01" value={currentEntry.price} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input id="quantity" name="quantity" type="number" value={currentEntry.quantity} onChange={handleInputChange} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" value={currentEntry.notes} onChange={handleInputChange} rows={4} placeholder="Add any observations or thoughts" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="voiceInput">Voice Input</Label>
                <div className="flex items-center space-x-2">
                  <Button type="button" onClick={startRecording} disabled={isRecording} className="bg-[#FF6D6D] text-white hover:bg-[#e05c5c]">
                    <Mic className="mr-2 h-4 w-4" />
                    Start Recording
                  </Button>
                  <Button type="button" onClick={stopRecording} disabled={!isRecording} variant="secondary" className="bg-gray-400 text-white hover:bg-gray-500">
                    <StopCircle className="mr-2 h-4 w-4" />
                    Stop Recording
                  </Button>
                </div>
                <Textarea
                  id="voiceInput"
                  value={voiceInput}
                  onChange={(e) => setVoiceInput(e.target.value)}
                  rows={4}
                  placeholder="Your voice input will appear here after stopping the recording..."
                />
              </div>
              <Button type="submit" className="bg-[#FF6D6D] text-white hover:bg-[#e05c5c]">Submit Entry</Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="insights">
        <Card>
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap">{aiInsights}</pre>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="performance">
        <Card>
          <CardHeader>
            <CardTitle>Performance Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={calculatePerformance()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="symbol" />
                  <YAxis yAxisId="left" orientation="left" stroke="#FF6D6D" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="quantity" fill="#FF6D6D" name="Quantity" />
                  <Bar yAxisId="right" dataKey="averageCost" fill="#82ca9d" name="Avg Cost" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="history">
        <Card>
          <CardHeader>
            <CardTitle>Journal History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {journalEntries.map((entry) => (
                <Card key={entry.id}>
                  <CardHeader>
                    <CardTitle>{entry.date} - {entry.symbol}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p><strong>Action:</strong> {entry.action}</p>
                    <p><strong>Price:</strong> ${entry.price}</p>
                    <p><strong>Quantity:</strong> {entry.quantity}</p>
                    <p><strong>Notes:</strong> {entry.notes}</p>
                    {entry.voiceInput && (
                      <p><strong>Voice Input:</strong> {entry.voiceInput}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
)
}
