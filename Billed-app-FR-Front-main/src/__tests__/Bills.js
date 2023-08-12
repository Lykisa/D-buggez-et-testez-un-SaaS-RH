/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom"
import userEvent from "@testing-library/user-event"

import { screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import Bills from "../containers/Bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js"

import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon.classList.contains('active-icon')).toBeTruthy();
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
  describe("when I click the new bill button", () => {
    test("Then it should open the employee new bill page", async() => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      const billsContainer = new Bills({
        document, onNavigate, store: mockStore, localStorage: window.localStorage
      })
      document.body.innerHTML = BillsUI({ data: bills })
     
      await waitFor(() => screen.getByTestId('btn-new-bill'))
      const newBillButton = screen.getByTestId("btn-new-bill");

      const handleClickNewBillButton = jest.fn(billsContainer.handleClickNewBill);

      newBillButton.addEventListener("click", handleClickNewBillButton);
      userEvent.click(newBillButton);

      
      expect(handleClickNewBillButton).toHaveBeenCalled();
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
    });
  });

  describe("When i get bills", () => {
    test("Then it should render bills", async () => {
      const bills = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const getBills = jest.fn(() => bills.getBills());
      const value = await getBills();

      expect(getBills).toHaveBeenCalled();
      expect(value.length).toBe(4);
    });
  });

  describe("When i click on the eye icon from a bill", () => {
    test("Then a modal must appear", () => {
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      const html = BillsUI({ data: [bills[1]] });
      document.body.innerHTML = html;
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const Store = null;
      const billsClass = new Bills({
        document,
        onNavigate,
        Store,
        localStorage: window.localStorage,
      });
      const modale = document.getElementById("modaleFile");

      $.fn.modal = jest.fn(() => modale.classList.add("show"));

      const handleClickIconEye = jest.fn(() => billsClass.handleClickIconEye);
      const iconEye = screen.getByTestId("icon-eye");

      iconEye.addEventListener("click", handleClickIconEye);

      userEvent.click(iconEye);
      expect(handleClickIconEye).toHaveBeenCalled();

      expect(modale.classList).toContain("show");
    });

    // TEST d'intégration GET
    describe("When the app try to fetch datas from the API", () => {
      describe("when it succeed", () => {
        test("Then it should return an array with the corresponding length", async () => {
          const getSpy = jest.spyOn(mockStore, "bills");
          const bills = mockStore.bills();
          expect(getSpy).toHaveBeenCalledTimes(1);
          expect((await bills.list()).length).toBe(4);
        });
      });
      describe("When an error occurs on API", () => {
        beforeEach(() => {
          jest.spyOn(mockStore, "bills")
          Object.defineProperty(
              window,
              'localStorage',
              { value: localStorageMock }
          )
          window.localStorage.setItem('user', JSON.stringify({
            type: 'Employee',
            email: "a@a"
          }))
          const root = document.createElement("div")
          root.setAttribute("id", "root")
          document.body.appendChild(root)
          router()
        })
        test("fetches bills from an API and fails with 404 message error", async () => {
    
          mockStore.bills.mockImplementationOnce(() => {
            return {
              list : () =>  {
                return Promise.reject(new Error("Erreur 404"))
              }
            }})
          const html = BillsUI({ error: "Erreur 404" })
          document.body.innerHTML = html
          const message = await screen.getByText(/Erreur 404/)
          expect(message).toBeTruthy()
        })
    
        test("fetches messages from an API and fails with 500 message error", async () => {
    
          mockStore.bills.mockImplementationOnce(() => {
            return {
              list : () =>  {
                return Promise.reject(new Error("Erreur 500"))
              }
            }})
    
          const html = BillsUI({ error: "Erreur 500" })
          document.body.innerHTML = html
          const message = await screen.getByText(/Erreur 500/)
          expect(message).toBeTruthy()
        })
      })
    });
  });
});

