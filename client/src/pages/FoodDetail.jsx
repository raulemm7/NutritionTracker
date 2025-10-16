import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

export default function FoodDetail(){
  const { id } = useParams()
  const [food, setFood] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(()=>{
    let mounted = true
    axios.get(`http://localhost:4000/api/foods/${id}`)
      .then(res => mounted && setFood(res.data))
      .catch(err => console.error(err))
      .finally(()=> mounted && setLoading(false))
    return ()=> mounted = false
  },[id])

  function addLog(){
    axios.post('http://localhost:4000/api/logs', { foodId: id, name: food.name, calories: food.calories })
      .then(res => setMessage('Logged!'))
      .catch(err => setMessage('Error'))
  }

  if (loading) return <div className="center">Loading...</div>
  if (!food) return <div className="center">Not found</div>
  return (
    <div className="detail">
      <h2>{food.name}</h2>
      <p>{food.description}</p>
      <ul>
        <li>Calories: {food.calories}</li>
        <li>Protein: {food.protein} g</li>
        <li>Carbs: {food.carbs} g</li>
        <li>Fat: {food.fat} g</li>
      </ul>
      <button onClick={addLog}>Add to Log</button>
      <div>{message}</div>
    </div>
  )
}
