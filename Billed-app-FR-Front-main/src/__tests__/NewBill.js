/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { bills } from "../fixtures/bills.js"
import Store from "../app/Store.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js"

import router from "../app/Router.js"
import userEvent from "@testing-library/user-event"


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then the mail icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()

      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId('icon-mail'))
      const mailIcon = screen.getByTestId('icon-mail')
      
      expect(mailIcon.classList.contains('active-icon')).toBeTruthy();
    })
    test("Then the page is showing", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      Object.defineProperty(window, "localStorage", { value: localStorageMock })
      window.localStorage.setItem("user", JSON.stringify({
        type: "Employee"
      }))
      new NewBill({
        document, onNavigate, store: null, localStorage: window.localStorage
      })    
      document.body.innerHTML = NewBillUI({ data: bills })
      await waitFor(() => screen.getByText("Envoyer une note de frais"))
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy()
    })
  })
  describe("Given I upload a file", () => {
    describe("When the file is not allowed", () => {
      test("Then a not allowed file message should show up", () => {
        const newBill = new NewBill({
          document, onNavigate, store: null, localStorage: window.localStorage
        })
        const file = new File(['image'], 'file.pdf', {type: 'application/pdf'});
        const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));

        const formNewBill = screen.getByTestId("form-new-bill")
        const billFile = screen.getByTestId('file');
        billFile.addEventListener("change", handleChangeFile);     
        userEvent.upload(billFile, file)
        expect(billFile.files[0].name).toBeDefined()
        expect(handleChangeFile).toBeCalled()

        expect(screen.getByText("Le fichier ne correspond pas au format")).toBeTruthy();
      })
    })
    describe("When the file is allowed", () => {
      test("Then the file is accepted", () => {
        const newBill = new NewBill({
          document, onNavigate, store: null, localStorage: window.localStorage
        })
        const file = new File(['image'], 'file.png', {type: 'image/png'});
        const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));

        const formNewBill = screen.getByTestId("form-new-bill")
        const billFile = screen.getByTestId('file');
        billFile.addEventListener("change", handleChangeFile);     
        userEvent.upload(billFile, file)
        expect(billFile.files[0].name).toBeDefined()
        expect(handleChangeFile).toBeCalled()

      })
    })
  })
  describe("Given I click on the submit button", () => {
    test("Then the handleSubmit function should be called", () => {
      Object.defineProperty(window, "localStorage", { value: localStorageMock })
      window.localStorage.setItem("user", JSON.stringify({
        type: "Employee"
      }))

      window.onNavigate(ROUTES_PATH.NewBill)

      const newBill = new NewBill({
        document, onNavigate, store: null, localStorage: window.localStorage
      })

      const newBillForm = screen.getByTestId('form-new-bill')
      const handleSubmit = jest.fn(newBill.handleSubmit)
      newBillForm.addEventListener("submit", handleSubmit)
      fireEvent.submit(newBillForm);

      expect(handleSubmit).toHaveBeenCalled();
    })
  })
})


/* TEST INTEGRATION POST */
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate on New Bills page", () => {
    test("he will create a New Bill (post)", async () => {
      jest.mock('../app/Store');
      const newBill = { 
        email: 'post@test.fr',
        type: "Employee",
        name:  "Vol Paris-Tokyo",
        amount: 3750,
        date:  "2023/07/26",
        vat: 20,
        pct: 20,
        commentary: "Réunion avec Mr Miyashi !",
        fileUrl: "file/url",
        fileName: "justificatif-20230726.jpeg",
        status: 'accepted'
      }
      Store.bill = () => ({ newBill, post: jest.fn().mockResolvedValue() })
      const getSpy = jest.spyOn(Store, "bill")
      const postReturn = Store.bill(newBill)
      expect(getSpy).toHaveBeenCalledTimes(1)
      expect(postReturn.newBill).toEqual(newBill)
    })
  })
})