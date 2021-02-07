const uuid = require('uuid')
const Joi = require('@hapi/joi')
const decoratorValidator = require('./utils/decoratorValidator')
const globalEnum = require('./utils/globalEnum')

class Handler {
  constructor ({ dynamoDBSvc }) {
    this.dynamoDBSvc = dynamoDBSvc
    this.dynamoDbTable = process.env.DYNAMODB_TABLE
  }

  static validator() {
    return Joi.object({
      name: Joi.string().max(100).min(2).required(),
      power: Joi.string().max(20).required()
    })
  }

  prepareData(data) {
    const params = {
      TableName: this.dynamoDbTable,
      Item: {
        ...data,
        id: uuid.v1(),
        created_at: new Date().toISOString()
      }
    }

    return params;
  }

  async insertItem(params) {
    return this.dynamoDBSvc.put(params).promise()
  }

  handlerSuccess(data) {
    const response = {
      statusCode: 200,
      body: JSON.stringify(data)
    }

    return response;
  }

  handlerError(data) {
    return {
      statusCode: data.statusCode || 501,
      headers: { 'Content-Type': 'text/plain ' },
      body: `Couldn\'t create item.`
    }
  }

  async main(event) {
    try {
      const data = event.body

      const dbParams = this.prepareData(data)
      await this.insertItem(dbParams)

      return this.handlerSuccess(dbParams.Item)
    } catch (error) {
      return this.handlerError({ statusCode: 500 })
    }
  }
}

const AWS = require('aws-sdk')
const enumParams = require('./utils/globalEnum')
const dynamoDB = new AWS.DynamoDB.DocumentClient()

const handler = new Handler({
  dynamoDBSvc: dynamoDB,
})

module.exports = decoratorValidator(
  handler.main.bind(handler), 
  Handler.validator(), 
  enumParams.ARG_TYPE.BODY
)