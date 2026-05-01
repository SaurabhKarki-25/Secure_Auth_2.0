const success = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data })
}

const error = (res, message = 'Something went wrong', statusCode = 500, errors = null) => {
  const body = { success: false, message }
  if (errors) body.errors = errors
  return res.status(statusCode).json(body)
}

const paginated = (res, data, pagination, message = 'Success') => {
  return res.status(200).json({ success: true, message, data, pagination })
}

module.exports = { success, error, paginated }
