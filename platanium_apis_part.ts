import StateService from '#providers/state_management'
import env from '#start/env'
import axios from 'axios'
import sgMail from '@sendgrid/mail'

const platinumEndPoint = env.get('PLATANIUM_API_ENDPOINT', '')
const platinumGatewayEndPoint = env.get('PLATANIUM_API_GATEWAY_BASE_URL', '')
const staging = env.get('NODE_ENV', '')
sgMail.setApiKey(env.get('SENDGRID_API_KEY2', ''))

const sendErrorEmail = async (errorDetails: Record<string, any>) => {
  const { name, status, message, responseData, requestData, requestHeaders, requestMethod, requestUrl } = errorDetails
  const emails = [
    env.get('PLATANIUM_API_ERROR_EMAIL_1'),
    env.get('PLATANIUM_API_ERROR_EMAIL_2'),
    env.get('PLATANIUM_API_ERROR_EMAIL_3'),
  ]
  const msg: any = {
    to: emails,
    from: { email: env.get('FROM_MAIL2', ''), name: 'MES Pensions' },
    subject: staging === 'development' ? 'STAGING Platinum API Error Notification' : 'Platinum API Error Notification',
    text: `
      An error occurred while accessing the Platinum API.
      
      API Name: ${name}
      Status: ${status || 'N/A'}
      Error Message: ${message}
      
      Request Details:
      Method: ${requestMethod}
      URL: ${requestUrl}
      Headers: ${JSON.stringify(requestHeaders, null, 2)}
      Request Data: ${JSON.stringify(requestData, null, 2)}
      
      Response Data: ${JSON.stringify(responseData, null, 2)}
    `,
  }

  try {
    await sgMail.send(msg)
    console.log('Error email sent successfully.')
  } catch (emailError) {
    console.error('Failed to send error email:', emailError)
  }
}

export const handlePlatinumApiError = async (error: any, name: string, requestData?: any) => {
  let errorDetails: Record<string, any> = {
    name,
    status: null,
    message: 'An unknown error occurred',
    responseData: null,
    requestData: requestData || null,
    requestHeaders: null,
    requestMethod: null,
    requestUrl: null,
  }

  if (axios.isAxiosError(error)) {
    if (error.response) {
      errorDetails.status = error.response.status
      errorDetails.message = `HTTP ${error.response.status}: ${error.response.statusText}`
      errorDetails.responseData = error.response.data
      errorDetails.requestHeaders = error.config?.headers
      errorDetails.requestMethod = error.config?.method?.toUpperCase()
      errorDetails.requestUrl = error.config?.url
    } else if (error.request) {
      errorDetails.message = 'No response received from the server. Possible server down or network issue.'
      errorDetails.requestHeaders = error.config?.headers
      errorDetails.requestMethod = error.config?.method?.toUpperCase()
      errorDetails.requestUrl = error.config?.url
    } else {
      errorDetails.message = `Request error: ${error.message}`
    }
  } else {
    errorDetails.message = error.message || 'Unexpected error occurred'
  }

  console.error('Platinum API Error:', errorDetails)
  await sendErrorEmail(errorDetails)
  throw new Error(errorDetails.message)
}

export const createMember = async (requestData: any) => {
  try {
    const response = await axios.post(`${platinumEndPoint}/members`, requestData, {
      headers: {
        Authorization: `Bearer ${StateService.get('platinumAccessToken')}`,
      },
    })
    return response.data
  } catch (error) {
    await handlePlatinumApiError(error, 'Create Member  /members', requestData)
  }
}

export const fetchTransfters = async (memeberId: string) => {
  try {
    const response = await axios.get(`${platinumEndPoint}/Members/${memeberId}/Transfers/In`, {
      headers: {
        Authorization: `Bearer ${StateService.get('platinumAccessToken')}`,
      },
    })
    return response.data
  } catch (error) {
    await handlePlatinumApiError(error, 'Fetch Transfers  /Transfers/In', { memberId: memeberId })
  }
}

export const fetchContributions = async (memeberId: string) => {
  try {
    const contributions = await axios.get(`${platinumEndPoint}/Members/${memeberId}/Contributions`, {
      headers: {
        Authorization: `Bearer ${StateService.get('platinumAccessToken')}`,
      },
    })

    const contributionsProfile = await axios.get(
      `${platinumEndPoint}/Members/${memeberId}/RegularContributionProfiles`,
      {
        headers: {
          Authorization: `Bearer ${StateService.get('platinumAccessToken')}`,
        },
      }
    )

    return { contributions: contributions.data, contributionsProfile: contributionsProfile.data }
  } catch (error) {
    await handlePlatinumApiError(error, 'Fetch Contributions  /Contributions', { memberId: memeberId })
  }
}

export const fetchTransfersInTransactions = async (memeberId: string, inId: string) => {
  try {
    const response = await axios.get(
      `${platinumEndPoint}/Members/${memeberId}/Transfers/In/${inId}/Transactions`,
      {
        headers: {
          Authorization: `Bearer ${StateService.get('platinumAccessToken')}`,
        },
      }
    )
    return response.data
  } catch (error) {
    await handlePlatinumApiError(
      error,
      'fetch Transfers In Transactions  /Transfers/In/inId/Transactions',
      { memberId: memeberId, inId: inId }
    )
  }
}

export const fetchSignleTransfersIn = async (memeberId: string, inId: string) => {
  try {
    if (!inId) return

    const response = await axios.get(`${platinumEndPoint}/Members/${memeberId}/Transfers/In/${inId}`, {
      headers: {
        Authorization: `Bearer ${StateService.get('platinumAccessToken')}`,
      },
    })
    return response.data
  } catch (error) {
    await handlePlatinumApiError(error, 'fetch Single Transactions In  /Transfers/In/inId', {
      memberId: memeberId,
      inId: inId,
    })
  }
}

export const getPlatinumProfileInfo = async (platinumId: string) => {
  try {
    const response = await axios.get(`${platinumEndPoint}/Members/${platinumId}/Detail/Personal`, {
      headers: {
        Authorization: `Bearer ${StateService.get('platinumAccessToken')}`,
      },
    })
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export const updateProfileInfo = async (platinumId: string, data: any) => {
  try {
    const platinumProfileInfo = await axios.patch(
      `${platinumEndPoint}/Members/${platinumId}/Detail/Personal`,
      data,
      {
        headers: {
          'Authorization': `Bearer ${StateService.get('platinumAccessToken')}`,
          'If-Match': data?.ConcurrencyToken,
        },
      }
    )
    return platinumProfileInfo.data
  } catch (error) {
    await handlePlatinumApiError(error, 'update Profile Info  /Detail/Personal', {
      platinumId: platinumId,
      data: data,
    })
  }
}

export const getBeneficiaries = async (platinumId: string) => {
  try {
    const beneficiaries = await axios.get(
      `${platinumEndPoint}/Members/${platinumId}/NominatedBeneficiaries`,
      {
        headers: {
          Authorization: `Bearer ${StateService.get('platinumAccessToken')}`,
        },
      }
    )
    return beneficiaries.data
  } catch (error) {
    await handlePlatinumApiError(error, 'Beneficiaries  /NominatedBeneficiaries', {
      platinumId: platinumId,
    })
  }
}

export const addNewContribution = async (platinumId: string, data: any) => {
  try {
    const addNewContributionAPI = await axios.post(
      `${platinumEndPoint}/members/${platinumId}/contributions/cash`,
      data,
      {
        headers: {
          Authorization: `Bearer ${StateService.get('platinumAccessToken')}`,
        },
      }
    )
    return addNewContributionAPI.data
  } catch (error) {
    await handlePlatinumApiError(error, 'Add New Contribution  /contributions/cash', {
      platinumId: platinumId,
      data: data,
    })
  }
}

export const getMemberPlanFK = async (platinumId: string) => {
  try {
    const response = await axios.get(`${platinumEndPoint}/members/${platinumId}/plans`, {
      headers: {
        Authorization: `Bearer ${StateService.get('platinumAccessToken')}`,
      },
    })
    return response.data
  } catch (error) {
    await handlePlatinumApiError(error, 'Get Member Plan FK  /members/platinumID/plans', {
      platinumId: platinumId,
    })
  }
}

export const getKeyContacts = async (memberId: string) => {
  try {
    const response = await axios.get(`${platinumEndPoint}/members/${memberId}/KeyContacts`, {
      headers: {
        Authorization: `Bearer ${StateService.get('platinumAccessToken')}`,
      },
    })
    return response.data
  } catch (error) {
    await handlePlatinumApiError(error, 'Get Key Contacts  /members/platinumID/KeyContacts', {
      memberId: memberId,
    })
  }
}

export const createOrganisation = async (data: any) => {
  try {
    const response = await axios.post(
      `${platinumEndPoint}/relationshipmanagement/organisations`,
      data,
      {
        headers: {
          Authorization: `Bearer ${StateService.get('platinumAccessToken')}`,
        },
      }
    )
    return response.data
  } catch (error) {
    await handlePlatinumApiError(
      error,
      'Create Organisation  /relationshipmanagement/organisations',
      data
    )
  }
}

export const getOrganizationInformation = async (organisationId: number) => {
  try {
    const organisationInformation = await axios.get(
      `${platinumEndPoint}/relationshipmanagement/organisations/${organisationId}/roles
      `,
      {
        headers: {
          Authorization: `Bearer ${StateService.get('platinumAccessToken')}`,
        },
      }
    )
    return organisationInformation.data
  } catch (error) {
    await handlePlatinumApiError(
      error,
      'Get Organization Information  /relationshipmanagement/organisations/organisationId/roles',
      { organisationId: organisationId }
    )
  }
}

export const isOrganizationNameAvailable = async (orgName: string) => {
  try {
    const filterQuery = `Name eq '${orgName}'`
    const response = await axios.get(`${platinumEndPoint}/relationshipmanagement/organisations`, {
      params: {
        $filter: filterQuery,
        $top: 1,
      },
      headers: {
        Authorization: `Bearer ${StateService.get('platinumAccessToken')}`,
      },
    })
    if (response.data && response.data.length > 0) {
      return false
    } else {
      return true
    }
  } catch (error) {
    await handlePlatinumApiError(
      error,
      'Is Organization Name Available  /relationshipmanagement/organisations',
      { orgName: orgName }
    )
  }
}

export const postInvestmentTypePortfolio = async (data: any) => {
  try {
    const response = await axios.post(
      `${platinumGatewayEndPoint}/external/datacommand/Investment/Type/3/Portfolio?api-version=1.0`,
      data,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': env.get('OCP_APIM_SUBSCRIPTION_KEY'),
        },
      }
    )
    return response.data
  } catch (error) {
    await handlePlatinumApiError(
      error,
      'POST investment type 3 porfolio /external/datacommand/Investment/Type/3/Portfolio'
    )
  }
}

export const getMemberAdviserRelations = async (memberId: string) => {
  try {
    const { data } = await axios.get(
      `${platinumGatewayEndPoint}/external/dataquery/odata/Members/${memberId}/Relations?api-version=1.0`,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': env.get('OCP_APIM_SUBSCRIPTION_KEY'),
        },
      }
    )
    return data?.value
  } catch (error) {
    await handlePlatinumApiError(
      error,
      'Get Member Adviser Relation /external/dataquery/odata/Members/{key}/Relations',
      { memberId: memberId }
    )
  }
}

export const getMemberFundSplit = async (memberId: string) => {
  try {
    const response = await axios.get(
      `${platinumGatewayEndPoint}/external/dataquery/odata/Members/${memberId}/FundSplit?api-version=1.0`,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': env.get('OCP_APIM_SUBSCRIPTION_KEY'),
        },
      }
    )
    return response.data
  } catch (error) {
    await handlePlatinumApiError(
      error,
      'Get Member Fund Split  /external/dataquery/odata/Members/memberId/FundSplit',
      { memberId: memberId }
    )
  }
}

export const getCrystallisationHistory = async (memberId: string) => {
  try {
    const response = await axios.get(
      `${platinumGatewayEndPoint}/external/dataquery/odata/Members/${memberId}/CrystallisationEvents?api-version=1.0`,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': env.get('OCP_APIM_SUBSCRIPTION_KEY'),
        },
      }
    )
    return response.data
  } catch (error) {
    await handlePlatinumApiError(
      error,
      'Get Crystallisation History  /external/dataquery/odata/Members/memberId/CrystallisationEvents',
      { memberId: memberId }
    )
  }
}

export const fetchValuation = async (memeberId: string) => {
  try {
    const response = await axios.get(
      `${platinumGatewayEndPoint}/external/dataquery/odata/Members(${memeberId})/Valuation?api-version=1.0`,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': env.get('OCP_APIM_SUBSCRIPTION_KEY'),
        },
      }
    )
    return response.data
  } catch (error) {
    await handlePlatinumApiError(
      error,
      'Fetch Valuation  /external/dataquery/odata/Members(memberId)/Valuation',
      { memberId: memeberId }
    )
  }
}

export const getMoneyInMoneyOut = async (plataniumMemberId: string) => {
  try {
    const response = await axios.get(
      `${platinumGatewayEndPoint}/external/dataquery/odata/Members/${plataniumMemberId}/MoneyInOut?api-version=1.0`,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': env.get('OCP_APIM_SUBSCRIPTION_KEY'),
        },
      }
    )
    return response.data
  } catch (error) {
    await handlePlatinumApiError(
      error,
      'Get Money In Money Out  /external/dataquery/odata/Members/plataniumMemberId/MoneyInOut',
      { plataniumMemberId: plataniumMemberId }
    )
  }
}

export const getBankAccounts = async (plataniumMemberId: String) => {
  try {
    const { data } = await axios.get(
      `${platinumGatewayEndPoint}/external/dataquery/odata/Members/${plataniumMemberId}/BankAccounts?api-version=1.0`,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': env.get('OCP_APIM_SUBSCRIPTION_KEY'),
        },
      }
    )
    return data?.value
  } catch (error) {
    await handlePlatinumApiError(
      error,
      'get Bank Accounts  /external/dataquery/odata/Members/plataniumMemberId/BankAccounts',
      { plataniumMemberId: plataniumMemberId }
    )
  }
}

export const getPortfolioData = async (plataniumMemberId: String) => {
  try {
    const { data } = await axios.get(
      `${platinumGatewayEndPoint}/external/dataquery/odata/Members/${plataniumMemberId}/Holdings?api-version=1.0`,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': env.get('OCP_APIM_SUBSCRIPTION_KEY'),
        },
      }
    )
    return data?.value
  } catch (error) {
    await handlePlatinumApiError(
      error,
      'Get Portfolio Data  /external/dataquery/odata/Members/plataniumMemberId/Holdings',
      { plataniumMemberId: plataniumMemberId }
    )
  }
}

export const fetchTransferOut = async (plataniumMemberId: String) => {
  try {
    const { data } = await axios.get(
      `${platinumEndPoint}/Members/${plataniumMemberId}/Transfers/Out`,
      {
        headers: {
          Authorization: `Bearer ${StateService.get('platinumAccessToken')}`,
        },
      }
    )
    return data
  } catch (error) {
    await handlePlatinumApiError(
      error,
      'fetchTransferOut  /Members/${plataniumMemberId}/Transfers/Out',
      { plataniumMemberId: plataniumMemberId }
    )
  }
}

export const fetchProducMemberStatus = async (plataniumMemberId: String) => {
  try {
    const { data } = await axios.get(`${platinumEndPoint}/Members/${plataniumMemberId}`, {
      headers: {
        Authorization: `Bearer ${StateService.get('platinumAccessToken')}`,
      },
    })
    return data
  } catch (error) {
    await handlePlatinumApiError(error, 'Fetch Member Status  /Members/plataniumMemberId', {
      plataniumMemberId: plataniumMemberId,
    })
  }
}

export const fetchPlansWithdrawals = async (memeberId: string) => {
  try {
    const { data } = await axios.get(
      `${platinumGatewayEndPoint}/external/dataquery/odata/Members/${memeberId}/Plans?api-version=1.0`,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': env.get('OCP_APIM_SUBSCRIPTION_KEY'),
        },
      }
    )
    return data?.value
  } catch (error) {
    await handlePlatinumApiError(
      error,
      'Fetch Plans Withdrawals  /external/dataquery/odata/Members/memeberId/Plans',
      { plataniumMemberId: memeberId }
    )
  }
}
