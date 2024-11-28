"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Send, Mic, ChevronRight, ChevronLeft, History, ClipboardCopy, Paperclip } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ColorScheme, colorSchemes } from "./themes"
import Decimal from 'decimal.js'

type AIModel = 'gpt4' | 'gpt35' | 'claude'

export function Calculator() {
  const [display, setDisplay] = useState("0")
  const [memory, setMemory] = useState(0)
  const [calculatorHistory, setCalculatorHistory] = useState<string[]>([])
  const [previousValue, setPreviousValue] = useState<number | null>(null)
  const [operation, setOperation] = useState<string | null>(null)
  const [newNumber, setNewNumber] = useState(true)
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "こんにちは！計算のお手伝いをさせていただきます。" }
  ])
  const [input, setInput] = useState("")
  const [colorScheme, setColorScheme] = useState<ColorScheme>('light')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true)
  const [rightPanelView, setRightPanelView] = useState<'chat' | 'history'>('chat')
  const [chatView, setChatView] = useState<'chat' | 'history'>('chat')
  const [aiModel, setAIModel] = useState<AIModel>('gpt4')
  const [previousResult, setPreviousResult] = useState<string | null>(null)
  const [expression, setExpression] = useState<string>("")
  const [currentInput, setCurrentInput] = useState("0")
  const [calculatedResult, setCalculatedResult] = useState("0")

  // Calculator functions
  const appendNumber = (number: string) => {
    if (newNumber) {
      setCurrentInput(number)
      if (operation) {
        setExpression(expression + number)
        const result = calculate(previousValue!, parseFloat(number), operation)
        setCalculatedResult(String(result))
      } else {
        // 三角関数の後の数字入力
        if (expression === 'sin' || expression === 'cos' || expression === 'tan') {
          // 三角関数の直後の数字入力
          setExpression(expression + number)
          setCalculatedResult(number)
        } else if (expression.startsWith('sin') || expression.startsWith('cos') || expression.startsWith('tan')) {
          // 三角関数の数字部分の追加
          setExpression(expression + number)
          setCalculatedResult(number)
        } else {
          // 通常の数字入力
          setExpression(number)
          setCalculatedResult(number)
        }
      }
      setNewNumber(false)
    } else {
      const newInput = currentInput === "0" ? number : currentInput + number
      setCurrentInput(newInput)
      if (operation) {
        const parts = expression.split(' ')
        parts[parts.length - 1] = newInput
        const newExpression = parts.join(' ')
        setExpression(newExpression)
        const result = calculate(previousValue!, parseFloat(newInput), operation)
        setCalculatedResult(String(result))
      } else {
        // 三角関数の数字部分の更新
        if (expression.startsWith('sin') || expression.startsWith('cos') || expression.startsWith('tan')) {
          const func = expression.slice(0, 3)
          const restOfExpression = expression.slice(3)
          if (restOfExpression === "") {
            setExpression(func + number)
          } else {
            setExpression(func + (restOfExpression + number))
          }
        } else {
          setExpression(newInput)
        }
        setCalculatedResult(newInput)
      }
    }
  }

  const appendDecimal = () => {
    if (newNumber) {
      setCurrentInput("0.")
      if (operation) {
        setExpression(expression + "0.")
      } else if (expression.startsWith('sin') || expression.startsWith('cos') || expression.startsWith('tan')) {
        // 三角関数の後の小数点
        setExpression(expression + "0.")
      } else {
        setExpression("0.")
      }
      setCalculatedResult("0.")
      setNewNumber(false)
    } else {
      if (!currentInput.includes(".")) {
        const newInput = currentInput + "."
        setCurrentInput(newInput)
        if (operation) {
          const parts = expression.split(' ')
          parts[parts.length - 1] = newInput
          setExpression(parts.join(' '))
        } else if (expression.startsWith('sin') || expression.startsWith('cos') || expression.startsWith('tan')) {
          // 三角関数の数字部分に小数点を追加
          const func = expression.slice(0, 3)
          const num = expression.slice(3)
          setExpression(func + num + ".")
        } else {
          setExpression(newInput)
        }
        setCalculatedResult(newInput)
      }
    }
  }

  const appendPi = () => {
    setDisplay(String(Math.PI))
    setNewNumber(true)
  }

  const calculate = (a: number, b: number, op: string): number => {
    const decimalA = new Decimal(a)
    const decimalB = new Decimal(b)
    
    try {
      let result: Decimal
      switch (op) {
        case "+":
          result = decimalA.plus(decimalB)
          break
        case "-":
          result = decimalA.minus(decimalB)
          break
        case "×":
          result = decimalA.times(decimalB)
          break
        case "÷":
          if (decimalB.isZero()) {
            throw new Error("0で割ることはできません")
          }
          result = decimalA.dividedBy(decimalB)
          break
        default:
          return b
      }
      
      // 必要に応じて小数点以下の桁数を調整（例：10桁まで）
      return Number(result.toDecimalPlaces(10).toString())
    } catch (error) {
      console.error("計算エラー:", error)
      return 0
    }
  }

  const calculateTrigValue = (func: string, angle: number): number => {
    switch (func) {
      case 'sin':
        return Math.sin(angle * Math.PI / 180)
      case 'cos':
        return Math.cos(angle * Math.PI / 180)
      case 'tan':
        return Math.tan(angle * Math.PI / 180)
      default:
        return angle
    }
  }

  const setOperator = (op: string) => {
    if (previousValue === null) {
      const trigFuncs = ['sin', 'cos', 'tan']
      const hasTrigFunc = trigFuncs.some(func => expression.startsWith(func))
      
      if (hasTrigFunc) {
        const func = expression.slice(0, 3)
        const angle = parseFloat(expression.slice(3))
        const result = calculateTrigValue(func, angle)
        setPreviousValue(result)
        setCalculatedResult(String(result))
        setExpression(`${expression} ${op} `)
      } else {
        const current = parseFloat(currentInput)
        setPreviousValue(current)
        setCalculatedResult(String(current))
        setExpression(`${current} ${op} `)
      }
    } else if (operation) {
      const current = parseFloat(currentInput)
      const result = calculate(previousValue, current, operation)
      setPreviousValue(result)
      setCalculatedResult(String(result))
      const parts = expression.split(' ')
      parts[parts.length - 1] = String(current)
      setExpression(parts.join(' ') + ` ${op} `)
      setCalculatorHistory([...calculatorHistory, `${previousValue} ${operation} ${current} = ${result}`])
    }
    setOperation(op)
    setNewNumber(true)
    setCurrentInput("0")
  }

  const calculateResult = () => {
    const trigFuncs = ['sin', 'cos', 'tan']
    const hasTrigFunc = trigFuncs.some(func => expression.startsWith(func))

    if (hasTrigFunc && !operation) {
      const func = expression.slice(0, 3)
      const angle = parseFloat(expression.slice(3))
      const result = calculateTrigValue(func, angle)
      setCalculatedResult(String(result))
      setExpression(`${expression} = ${result}`)
      setCalculatorHistory([...calculatorHistory, `${expression} = ${result}`])
    } else if (previousValue !== null && operation) {
      const current = parseFloat(currentInput)
      const result = calculate(previousValue, current, operation)
      setPreviousResult(currentInput)
      setCalculatedResult(String(result))
      
      const parts = expression.split(' ')
      parts[parts.length - 1] = String(current)
      setExpression(parts.join(' ') + ` = ${result}`)
      
      setCalculatorHistory([...calculatorHistory, `${expression} = ${result}`])
    }
    setPreviousValue(null)
    setOperation(null)
    setNewNumber(true)
  }

  const clear = () => {
    setCurrentInput("0")
    setCalculatedResult("0")
    setPreviousValue(null)
    setOperation(null)
    setNewNumber(true)
    setExpression("")
  }

  const clearAll = () => {
    clear()
    setCalculatorHistory([])
    setMemory(0)
  }

  const del = () => {
    if (expression.startsWith('sin') || expression.startsWith('cos') || expression.startsWith('tan')) {
      // 三角関数の入力中の場合
      if (expression.length > 3) {
        // 数字部分がある場合は最後の数字を削除
        setExpression(expression.slice(0, -1))
        setCalculatedResult(expression.slice(3, -1) || "0")
        setCurrentInput(expression.slice(3, -1) || "0")
      } else {
        // 三角関数部分のみの場合は全てクリア
        clear()
      }
    } else if (expression.length > 1) {
      setExpression(expression.slice(0, -1))
      setCalculatedResult(expression.slice(0, -1))
      setCurrentInput(expression.slice(0, -1))
    } else {
      clear()
    }
  }

  const square = () => {
    try {
      const num = new Decimal(currentInput)
      const result = num.times(num)
      setCurrentInput(result.toString())
      setCalculatedResult(result.toString())
      setNewNumber(true)
    } catch (error) {
      console.error("計算エラー:", error)
    }
  }

  const sin = () => {
    if (operation) {
      setExpression(expression + 'sin')
    } else {
      setExpression('sin')
    }
    setNewNumber(true)
    setCurrentInput("0")
  }

  const cos = () => {
    if (operation) {
      setExpression(expression + 'cos')
    } else {
      setExpression('cos')
    }
    setNewNumber(true)
    setCurrentInput("0")
  }

  const tan = () => {
    if (operation) {
      setExpression(expression + 'tan')
    } else {
      setExpression('tan')
    }
    setNewNumber(true)
    setCurrentInput("0")
  }

  const circleArea = () => {
    try {
      const radius = new Decimal(currentInput)
      const result = radius.times(radius).times(Decimal.acos(-1)) // Decimal.acos(-1) は π
      setCurrentInput(result.toString())
      setCalculatedResult(result.toString())
      setNewNumber(true)
    } catch (error) {
      console.error("計算エラー:", error)
    }
  }

  const multiplyBy = (factor: number) => {
    const current = parseFloat(currentInput)
    const result = calculate(current, factor, '×')
    setCalculatedResult(String(result))
    
    if (operation) {
      const parts = expression.split(' ')
      const lastNum = parseFloat(parts[parts.length - 1] || current)
      parts[parts.length - 1] = String(lastNum * factor)
      setExpression(parts.join(' '))
    } else {
      setExpression(`${current} × ${factor}`)
    }
    
    setCurrentInput(String(result))
    setNewNumber(true)
  }

  const mmToM = () => {
    try {
      const mm = new Decimal(currentInput)
      const result = mm.dividedBy(1000)
      setCurrentInput(result.toString())
      setCalculatedResult(result.toString())
      setNewNumber(true)
    } catch (error) {
      console.error("計算エラー:", error)
    }
  }

  const mmCubeToMCube = () => {
    try {
      const mmCube = new Decimal(currentInput)
      const result = mmCube.dividedBy(1000000000)
      setCurrentInput(result.toString())
      setCalculatedResult(result.toString())
      setNewNumber(true)
    } catch (error) {
      console.error("計算エラー:", error)
    }
  }

  const getButtonClass = (type: keyof typeof colorSchemes[ColorScheme]) => {
    const baseClasses = "transition-colors duration-200"
    const colorClass = colorSchemes[colorScheme][type]
    const textColor = type === 'secondary' ? 'text-slate-800' : 'text-white'
    return `${baseClasses} ${colorClass} ${textColor} ${isDarkMode ? 'dark' : ''}`
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage = { role: "user" as const, content: input }
    let response = { role: "assistant" as const, content: "" }
    
    try {
      const result = eval(input.replace('×', '*').replace('÷', '/'))
      if (typeof result === 'number' && !isNaN(result)) {
        response.content = `計算結果は ${result} です。`
      } else {
        response.content = "申し訳ありません。その計算式は理解できませんでした。"
      }
    } catch {
      response.content = "申し訳ありません。その計算式は理解できませんでした。"
    }

    setMessages([...messages, userMessage, response])
    setInput("")
  }

  const handleVoiceInput = async () => {
    try {
      const recognition = new (window.webkitSpeechRecognition || window.SpeechRecognition)()
      recognition.lang = 'ja-JP'
      recognition.start()
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
      }
    } catch (error) {
      console.error('Speech recognition not supported')
    }
  }

  const usePreviousResult = () => {
    if (previousResult) {
      setDisplay(previousResult)
      setNewNumber(true)
    }
  }

  const toggleColorScheme = () => {
    setColorScheme(current => {
      switch (current) {
        case 'light': return 'dark'
        case 'dark': return 'system'
        default: return 'light'
      }
    })
  }

  // キーボードイベントのハンドラーを修正
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // フォーム入力中は計算機のキー入力を無効化
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      e.preventDefault() // デフォルトのキー入力を防止

      // 数字キー (0-9)
      if (/^[0-9]$/.test(e.key)) {
        appendNumber(e.key)
      }
      // 小数点
      else if (e.key === '.') {
        appendDecimal()
      }
      // 演算子
      else if (e.key === '+' || e.key === '-') {
        setOperator(e.key)
      }
      else if (e.key === '*' || e.key === 'x' || e.key === '×') {
        setOperator('×')
      }
      else if (e.key === '/' || e.key === '÷') {
        setOperator('÷')
      }
      // 三角関数
      else if (e.key.toLowerCase() === 's') {
        sin()
      }
      else if (e.key.toLowerCase() === 'c') {
        cos()
      }
      else if (e.key.toLowerCase() === 't') {
        tan()
      }
      // イコール (Enter)
      else if (e.key === 'Enter' || e.key === '=') {
        calculateResult()
      }
      // 削除 (Backspace)
      else if (e.key === 'Backspace') {
        del()
      }
      // クリア (Escape)
      else if (e.key === 'Escape') {
        clearAll()
      }
    }

    // イベントリスナーを追加
    window.addEventListener('keydown', handleKeyDown)

    // クリーンアップ関数
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [expression, currentInput, previousValue, operation]) // expressionを依存配列に追加

  return (
    <div className={`flex gap-0 p-4 ${isDarkMode ? 'dark bg-slate-900' : 'bg-gray-50'}`}>
      <div className="flex">
        <Card className={`w-96 ${isDarkMode ? 'dark bg-slate-800 border-slate-700' : ''} ${isRightPanelOpen ? 'rounded-r-none border-r-0' : ''}`}>
          <CardContent className="p-4">
            <div className="grid grid-cols-4 gap-2 mb-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={toggleColorScheme}
              >
                デザイン
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsDarkMode(!isDarkMode)}
              >
                スクショ
              </Button>
              <Button
                variant="outline"
                className="w-full"
              >
                延長取得
              </Button>
              <Button
                variant="outline"
                className="w-full"
              >
                CAD読込
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Button className={getButtonClass('secondary')} onClick={mmToM}>mm → m</Button>
              <Button className={getButtonClass('secondary')} onClick={mmCubeToMCube}>mm³ → m³</Button>
            </div>
            <div className="flex gap-2 mb-4">
              <div className={`flex-1 rounded-lg ${isDarkMode ? 'bg-slate-700' : colorSchemes[colorScheme].display} p-4 shadow-inner`}>
                <div className="text-right text-sm text-muted-foreground h-5">
                  {expression}
                </div>
                <div className="text-right text-4xl font-bold tabular-nums">
                  {calculatedResult}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="px-2 h-auto self-stretch"
                onClick={() => {
                  navigator.clipboard.writeText(calculatedResult)
                }}
              >
                <ClipboardCopy className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-5 gap-2">
                  <Button variant="ghost" className="bg-slate-100 hover:bg-slate-200 text-slate-800">45°</Button>
                  <Button className={getButtonClass('primary')} onClick={() => appendNumber("7")}>7</Button>
                  <Button className={getButtonClass('primary')} onClick={() => appendNumber("8")}>8</Button>
                  <Button className={getButtonClass('primary')} onClick={() => appendNumber("9")}>9</Button>
                  <Button className={`${getButtonClass('secondary')} text-xl`} onClick={() => setOperator("÷")}>÷</Button>

                  <Button variant="ghost" className="bg-slate-100 hover:bg-slate-200 text-slate-800">22°</Button>
                  <Button className={getButtonClass('primary')} onClick={() => appendNumber("4")}>4</Button>
                  <Button className={getButtonClass('primary')} onClick={() => appendNumber("5")}>5</Button>
                  <Button className={getButtonClass('primary')} onClick={() => appendNumber("6")}>6</Button>
                  <Button className={`${getButtonClass('secondary')} text-xl`} onClick={() => setOperator("×")}>×</Button>

                  <Button variant="ghost" className="bg-slate-100 hover:bg-slate-200 text-slate-800">11°</Button>
                  <Button className={getButtonClass('primary')} onClick={() => appendNumber("1")}>1</Button>
                  <Button className={getButtonClass('primary')} onClick={() => appendNumber("2")}>2</Button>
                  <Button className={getButtonClass('primary')} onClick={() => appendNumber("3")}>3</Button>
                  <Button className={`${getButtonClass('secondary')} text-xl`} onClick={() => setOperator("-")}>-</Button>

                  <Button variant="ghost" className="bg-slate-100 hover:bg-slate-200 text-slate-800">5°</Button>
                  <Button className={getButtonClass('primary')} onClick={() => appendNumber("0")}>0</Button>
                  <Button className={getButtonClass('primary')} onClick={appendDecimal}>.</Button>
                  <Button className={getButtonClass('primary')} onClick={appendPi}>π</Button>
                  <Button className={`${getButtonClass('secondary')} text-xl`} onClick={() => setOperator("+")}>+</Button>

                  <Button variant="ghost" className="bg-slate-100 hover:bg-slate-200 text-slate-800" onClick={() => appendNumber("00")}>00</Button>
                  <Button className={getButtonClass('accent')} onClick={del}>DEL</Button>
                  <Button className={getButtonClass('accent')} onClick={clear}>C</Button>
                  <Button className={getButtonClass('accent')} onClick={clearAll}>AC</Button>
                  <Button className={getButtonClass('accent')} onClick={calculateResult}>=</Button>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Button className={getButtonClass('accent')} onClick={square}>x²</Button>
                  <Button className={getButtonClass('accent')} onClick={sin}>sin</Button>
                  <Button className={getButtonClass('accent')} onClick={cos}>cos</Button>
                  
                  <Button className={getButtonClass('accent')} onClick={tan}>tan</Button>
                  <Button className={getButtonClass('accent')}>(</Button>
                  <Button className={getButtonClass('accent')}>)</Button>

                  <Button className={getButtonClass('accent')} onClick={circleArea}>円面積</Button>
                  <Button className={getButtonClass('accent')} onClick={() => multiplyBy(5)}>×5</Button>
                  <Button className={getButtonClass('accent')} onClick={() => multiplyBy(2.5)}>×2.5</Button>

                  <Button className={getButtonClass('accent')} onClick={() => multiplyBy(0.2)}>×0.2</Button>
                  <Button className={getButtonClass('accent')} onClick={() => multiplyBy(0.4)}>×0.4</Button>
                  <Button 
                    className={getButtonClass('accent')} 
                    onClick={usePreviousResult}
                    disabled={!previousResult}
                  >
                    直前値
                  </Button>
                </div>

                <div className="mt-4 flex gap-2">
                  <Input
                    placeholder="Enter mathematical expression."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className={isDarkMode ? 'bg-slate-700 border-slate-600' : ''}
                  />
                  <Button onClick={handleSendMessage} size="icon" className={getButtonClass('primary')}>
                    <Send className="h-4 w-4" />
                  </Button>
                  <Button onClick={handleVoiceInput} size="icon" className={getButtonClass('primary')}>
                    <Mic className="h-4 w-4" />
                  </Button>
                </div>
          </CardContent>
        </Card>

        {isRightPanelOpen && (
          <Card className={`w-96 ${isDarkMode ? 'dark bg-slate-800 border-slate-700' : ''} rounded-l-none relative`}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={rightPanelView === 'chat' ? 'bg-secondary' : ''}
                    onClick={() => setRightPanelView('chat')}
                  >
                    チャット
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={rightPanelView === 'history' ? 'bg-secondary' : ''}
                    onClick={() => setRightPanelView('history')}
                  >
                    計算履歴
                  </Button>
                </div>
                {rightPanelView === 'chat' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setChatView(chatView === 'chat' ? 'history' : 'chat')}
                  >
                    <History className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {rightPanelView === 'chat' ? (
                <>
                  <ScrollArea className="h-[500px] mb-4">
                    {chatView === 'chat' ? (
                      messages.map((message, index) => (
                        <div
                          key={index}
                          className={`mb-4 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`rounded-lg px-4 py-2 max-w-[80%] ${
                              message.role === "user"
                                ? getButtonClass('primary')
                                : isDarkMode ? 'bg-slate-700' : 'bg-slate-100'
                            }`}
                          >
                            {message.content}
                          </div>
                        </div>
                      ))
                    ) : (
                      messages.map((message, index) => (
                        <div key={index} className="mb-2 text-sm">
                          <strong>{message.role === "user" ? "あな" : "アシスタント"}:</strong> {message.content}
                        </div>
                      ))
                    )}
                  </ScrollArea>
                  <div className="space-y-2">
                    <Select value={aiModel} onValueChange={(value) => setAIModel(value as AIModel)}>
                      <SelectTrigger>
                        <SelectValue placeholder="AIモデルを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt4">GPT-4</SelectItem>
                        <SelectItem value="gpt35">GPT-3.5</SelectItem>
                        <SelectItem value="claude">Claude</SelectItem>
                      </SelectContent>
                    </Select>
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="計算式を入力してください..."
                        className={isDarkMode ? 'bg-slate-700 border-slate-600' : ''}
                      />
                      <Button type="submit" size="icon" className={getButtonClass('primary')}>
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button 
                        type="button"
                        size="icon" 
                        className={getButtonClass('primary')}
                        onClick={handleVoiceInput}
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                      <Button 
                        type="button"
                        size="icon" 
                        className={getButtonClass('primary')}
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <ScrollArea className="h-[550px]">
                  {calculatorHistory.map((entry, index) => (
                    <div key={index} className="mb-2 text-sm">
                      {entry}
                    </div>
                  ))}
                </ScrollArea>
              )}
            </CardContent>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`absolute right-[-40px] top-0 bottom-0 h-full flex items-center justify-center w-10 ${isDarkMode ? 'text-white hover:bg-slate-700' : 'hover:bg-slate-100'}`}
              onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Card>
        )}

        {!isRightPanelOpen && (
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-full flex items-center justify-center w-10 ${isDarkMode ? 'text-white hover:bg-slate-700' : 'hover:bg-slate-100'}`}
            onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

